package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/quic-go/quic-go"
)

type PrimaryPeer struct {
	Name             string `json:"name"`
	Address          string `json:"address"`
	PublicKey        string `json:"public_key"`
	Identity         string `json:"identity"`
	Port             string `json:"port"`
	Home             string `json:"home"`
	Ledger           string `json:"ledger"`
	FiredancerPath   string `json:"firedancer_path"`
	VanityKey        string `json:"vanity_key"`
	FiredancerConfig string `json:"firedancer_config"`
}

type AllConfig struct {
	Peers   []AllowedPeer `json:"peers"`
	Primary PrimaryPeer   `json:"primary"`
	Backup  AllowedPeer
}

type AllowedPeer struct {
	Name             string `json:"name"`
	Address          string `json:"address"`
	Home             string `json:"home"`
	Ledger           string `json:"ledger"`
	FiredancerPath   string `json:"firedancer_path"`
	IdentityKey      string `json:"identity_key"`
	FiredancerConfig string `json:"firedancer_config"`
}

var allConfig AllConfig
var validator string = "Agave"
var validatorExec string = "agave-validator"

func main() {
	// Parse command line flag for mode
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	mode := "primary"
	peerName := "backup"

	if len(os.Args) > 1 {
		mode = os.Args[1]

		if mode != "primary" {
			peerName = os.Args[3]
		}
	}

	// Load peer configuration
	log.Printf("Loading peer configuration...")
	err := loadAllConfig("peers.json", peerName)
	if err != nil {
		log.Fatal("Failed to load peer configuration:", err)
	}

	if len(os.Args) > 1 {
		if os.Args[2] == "Firedancer" {
			validator = "Firedancer"
			if mode == "primary" {
				validatorExec = allConfig.Primary.FiredancerPath
			} else {
				validatorExec = allConfig.Backup.FiredancerPath
			}
		}
	}

	// Load existing certificates (required)
	log.Printf("Loading TLS configuration...")
	tlsConfig, err := loadTLSConfig(mode)
	if err != nil {
		log.Fatal("Failed to load TLS config:", err)
	}

	if mode == "primary" {
		log.Printf("Running as primary server...")
		runPrimaryServer(tlsConfig)
	} else {
		log.Printf("Running as backup client...")
		runBackupClient(tlsConfig)
	}
	log.Printf("Application started in %s mode", mode)
}

func runPrimaryServer(tlsConfig *tls.Config) {
	// Optimized QUIC configuration
	quicConfig := &quic.Config{
		KeepAlivePeriod:       10 * time.Second,
		MaxIdleTimeout:        30 * time.Second,
		MaxIncomingStreams:    100,
		MaxIncomingUniStreams: 100,
		Allow0RTT:             true,
	}

	primaryPeer := allConfig.Primary

	listener, err := quic.ListenAddr("0.0.0.0:"+primaryPeer.Port, tlsConfig, quicConfig)
	if err != nil {
		log.Fatal("Failed to create QUIC listener:", err)
	}
	defer listener.Close()

	log.Printf("Primary peer listening on %s", primaryPeer.Port)

	for {
		// Accept incoming connections
		conn, err := listener.Accept(context.Background())
		if err != nil {
			log.Printf("Failed to accept connection: %v", err)
			continue
		}

		log.Printf("New connection from %s", conn.RemoteAddr())

		// Handle connection in a goroutine
		go handleBackupConnection(conn)
	}
}

func runBackupClient(tlsConfig *tls.Config) {
	primaryPeer := allConfig.Primary

	log.Printf("Backup peer connecting to primary at %s", primaryPeer.Address)

	// Optimized QUIC configuration for client
	quicConfig := &quic.Config{
		KeepAlivePeriod:    10 * time.Second,
		MaxIdleTimeout:     30 * time.Second,
		MaxIncomingStreams: 100,
		Allow0RTT:          true,
	}

	conn, err := quic.DialAddr(context.Background(), primaryPeer.Address+":"+primaryPeer.Port, tlsConfig, quicConfig)
	if err != nil {
		log.Fatal("Failed to connect to primary:", err)
	}
	defer conn.CloseWithError(0, "Connection closed")

	log.Printf("Connected to primary peer")

	// Handle incoming streams from primary (for file transfer)
	go handleIncomingStreamsFromPrimary(conn)

	// Automatically request file after connection
	time.Sleep(100 * time.Millisecond) // Reduced delay
	requestFileFromPrimary(conn)

	// Keep the connection alive
	select {}
}

func handleBackupConnection(conn *quic.Conn) {
	for {
		// Accept incoming streams from backup
		stream, err := conn.AcceptStream(context.Background())
		if err != nil {
			log.Printf("Failed to accept stream: %v", err)
			return
		}

		// Handle stream in a goroutine - no message type checks
		go handleStreamFromBackup(stream, conn)
	}
}

func handleStreamFromBackup(stream *quic.Stream, conn *quic.Conn) {
	defer stream.Close()

	log.Printf("Received file request from backup peer")

	// Send confirmation
	confirmation := "File request received, sending file..."
	_, err := stream.Write([]byte(confirmation))
	if err != nil {
		log.Printf("Failed to send confirmation: %v", err)
		return
	}

	// Send the file immediately
	go sendFileToBackup(conn)
}

func sendFileToBackup(conn *quic.Conn) {
	filePath := fmt.Sprintf("%s/tower-1_9-%s.bin", allConfig.Primary.Ledger, allConfig.Primary.Identity)

	// Create test file if needed
	if !fileExists(filePath) {
		log.Fatalf("File %s does not exist. Please create it before running the primary peer.", filePath)
	}

	if validator == "Agave" {
		restartCommand := fmt.Sprintf("%s -l %s wait-for-restart-window --min-idle-time 2 --skip-new-snapshot-check", validatorExec, allConfig.Primary.Ledger)
		_, cmdErr := executeCommand(restartCommand)
		if cmdErr != 0 {
			log.Fatalf("Failed to execute command for validator restart: %v", cmdErr)
		}
	}

	setCommand := fmt.Sprintf("%s -l %s set-identity %s", validatorExec, allConfig.Primary.Ledger, allConfig.Primary.VanityKey)
	if validator == "Firedancer" {
		setCommand = fmt.Sprintf("%s -l %s --config %s set-identity %s", validatorExec, allConfig.Primary.Ledger, allConfig.Primary.FiredancerConfig, allConfig.Primary.VanityKey)
	}

	_, cmdErr := executeCommand(setCommand)

	if cmdErr != 0 {
		log.Printf("Failed to execute command for setting identity: %v", cmdErr)
		return
	}

	transferStart := time.Now()

	// Open stream immediately
	stream, err := conn.OpenStreamSync(context.Background())
	if err != nil {
		log.Printf("Failed to open stream for file transfer: %v", err)
		return
	}
	defer stream.Close()

	// Open file
	file, err := os.Open(filePath)
	if err != nil {
		log.Printf("Failed to open file: %v", err)
		return
	}
	defer file.Close()

	// Get file info
	fileInfo, err := file.Stat()
	if err != nil {
		log.Printf("Failed to get file info: %v", err)
		return
	}

	filename := filepath.Base(filePath)
	fileSize := fileInfo.Size()

	log.Printf("Sending file to backup: %s (%d bytes)", filename, fileSize)

	// Create single buffer with metadata + file contents
	filenameLen := uint32(len(filename))
	metadataSize := 4 + len(filename) + 8 // filename_len + filename + file_size
	totalSize := int64(metadataSize) + fileSize

	// Always send everything in one buffer (assuming small files)
	buffer := make([]byte, totalSize)
	offset := 0

	// Filename length
	binary.BigEndian.PutUint32(buffer[offset:offset+4], filenameLen)
	offset += 4

	// Filename
	copy(buffer[offset:offset+len(filename)], []byte(filename))
	offset += len(filename)

	// File size
	binary.BigEndian.PutUint64(buffer[offset:offset+8], uint64(fileSize))
	offset += 8

	// File contents
	_, err = file.Read(buffer[offset:])
	if err != nil {
		log.Printf("Failed to read file contents: %v", err)
		return
	}

	// Send everything at once
	dataStart := time.Now()
	written, err := stream.Write(buffer)
	if err != nil {
		log.Printf("Failed to send file: %v", err)
		return
	}

	dataTransferTime := time.Since(dataStart)
	log.Printf("File sent in one write: %d bytes in %v", written, dataTransferTime)

	// Read confirmation
	confirmBuffer := make([]byte, 1024)
	n, err := stream.Read(confirmBuffer)
	if err == nil && n > 0 {
		totalTime := time.Since(transferStart)
		log.Printf("Backup confirmed: %s", string(confirmBuffer[:n]))
		log.Printf("Total transfer time: %v", totalTime)

		// Calculate transfer rate
		if totalTime.Seconds() > 0 {
			rate := float64(fileSize) / (1024 * 1024) / totalTime.Seconds()
			log.Printf("Transfer rate: %.2f MB/s", rate)
		}
	}

	// Exit primary after successful transfer
	log.Printf("Primary peer exiting after successful file transfer...")
	time.Sleep(500 * time.Millisecond)
	os.Exit(0)
}

func requestFileFromPrimary(conn *quic.Conn) {
	log.Printf("Requesting file from primary peer...")

	// Create a new stream for the file transfer request
	stream, err := conn.OpenStreamSync(context.Background())
	if err != nil {
		log.Printf("Failed to open stream: %v", err)
		return
	}
	defer stream.Close()

	// Send simple request (no message type)
	_, err = stream.Write([]byte("FILE_REQUEST"))
	if err != nil {
		log.Printf("Failed to write request: %v", err)
		return
	}

	log.Printf("File transfer request sent successfully")

	// Read response from primary
	buffer := make([]byte, 1024)
	n, err := stream.Read(buffer)
	if err != nil {
		if err == io.EOF {
			log.Printf("Request stream ended")
			return
		}
		log.Printf("Failed to read response: %v", err)
		return
	}
	response := string(buffer[:n])
	log.Printf("Primary response: %s", response)
}

func handleIncomingStreamsFromPrimary(conn *quic.Conn) {
	log.Printf("Handling incoming streams from primary %s", conn.RemoteAddr())

	for {
		// Accept incoming streams
		stream, err := conn.AcceptStream(context.Background())
		if err != nil {
			log.Printf("Failed to accept stream: %v", err)
			return
		}

		// Handle stream directly (no message type checks)
		go handleFileReceive(stream)
	}
}

func handleFileReceive(stream *quic.Stream) {
	defer stream.Close()

	receiveStart := time.Now()
	log.Printf("Starting file receive at %v", receiveStart.Format("15:04:05.000"))

	// Read filename length
	filenameLenBytes := make([]byte, 4)
	_, err := io.ReadFull(stream, filenameLenBytes)
	if err != nil {
		log.Printf("Failed to read filename length: %v", err)
		return
	}
	filenameLen := binary.BigEndian.Uint32(filenameLenBytes)

	// Read filename
	filenameBytes := make([]byte, filenameLen)
	_, err = io.ReadFull(stream, filenameBytes)
	if err != nil {
		log.Printf("Failed to read filename: %v", err)
		return
	}
	filename := string(filenameBytes)

	// Read file size
	fileSizeBytes := make([]byte, 8)
	_, err = io.ReadFull(stream, fileSizeBytes)
	if err != nil {
		log.Printf("Failed to read file size: %v", err)
		return
	}
	fileSize := int64(binary.BigEndian.Uint64(fileSizeBytes))

	log.Printf("Receiving file: %s (%d bytes)", filename, fileSize)

	outputPath := filepath.Join(allConfig.Backup.Ledger, filename)
	file, err := os.Create(outputPath)
	if err != nil {
		log.Printf("Failed to create file: %v", err)
		return
	}
	defer file.Close()

	// Read file data - assuming small file, read all at once
	dataStart := time.Now()
	buffer := make([]byte, fileSize)
	totalRead, err := io.ReadFull(stream, buffer)
	if err != nil {
		log.Printf("Failed to read file data: %v", err)
		return
	}

	_, err = file.Write(buffer)
	if err != nil {
		log.Printf("Failed to write to file: %v", err)
		return
	}

	dataReceiveTime := time.Since(dataStart)
	totalReceiveTime := time.Since(receiveStart)

	log.Printf("File received in one read: %d bytes in %v", totalRead, dataReceiveTime)
	log.Printf("Total receive time: %v", totalReceiveTime)

	// Calculate receive rate
	if totalReceiveTime.Seconds() > 0 {
		rate := float64(fileSize) / (1024 * 1024) / totalReceiveTime.Seconds()
		log.Printf("Receive rate: %.2f MB/s", rate)
	}

	// Send confirmation
	confirmation := fmt.Sprintf("File received: %s (%d bytes)", filename, fileSize)
	_, err = stream.Write([]byte(confirmation))
	if err != nil {
		log.Printf("Failed to send confirmation: %v", err)
		return
	}

	log.Printf("File transfer completed successfully!")

	// Execute command and exit
	executeCommandAndExit(allConfig.Backup.IdentityKey)
}

func executeCommandAndExit(filePath string) {
	log.Printf("Executing command after receiving file: %s", filePath)

	// Define the command to execute
	command := fmt.Sprintf("%s -l %s --require-tower set-identity %s", validatorExec, allConfig.Backup.Ledger, allConfig.Backup.IdentityKey)

	if validator == "Firedancer" {
		command = fmt.Sprintf("%s -l %s --config %s set-identity %s", validatorExec, allConfig.Backup.Ledger, allConfig.Backup.FiredancerConfig, allConfig.Backup.IdentityKey)
	}
	log.Printf("Executing command: %s", command)

	// Execute the command
	output, exitCode := executeCommand(command)

	log.Printf("Command executed. Exit code: %d", exitCode)
	if exitCode == 0 {
		log.Printf("Command output: %s", strings.TrimSpace(output))
		log.Printf("✅ Backup successfully processed the file and executed the command!")
	} else {
		log.Printf("Command failed with output: %s", strings.TrimSpace(output))
		log.Printf("❌ Command execution failed with exit code: %d", exitCode)
	}

	command = fmt.Sprintf("%s -l %s authorized-voter add %s", validatorExec, allConfig.Backup.Ledger, filePath)

	_, cmdErr := executeCommand(command)
	if cmdErr != 0 {
		log.Printf("Failed to execute command for adding authorized voter: %v", cmdErr)
		return
	}

	// Exit backup after command execution
	log.Printf("Backup peer exiting after command execution...")
	time.Sleep(500 * time.Millisecond)
	if exitCode == 0 {
		os.Exit(0)
	} else {
		os.Exit(1)
	}
}

func executeCommand(command string) (string, int) {
	parts := strings.Fields(command)
	if len(parts) == 0 {
		return "Error: empty command", 1
	}

	cmd := exec.Command(parts[0], parts[1:]...)
	output, err := cmd.CombinedOutput()

	exitCode := 0
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			exitCode = exitError.ExitCode()
		} else {
			exitCode = 1
		}
	}

	return string(output), exitCode
}

func loadAllConfig(configPath, peerName string) error {
	file, err := os.Open(configPath)
	if err != nil {
		return fmt.Errorf("failed to open config file: %v", err)
	}
	defer file.Close()

	decoder := json.NewDecoder(file)

	err = decoder.Decode(&allConfig)
	if err != nil {
		return fmt.Errorf("failed to decode config file: %v", err)
	}

	// Find the backup peer configuration
	for _, peer := range allConfig.Peers {
		if peer.Name == peerName {
			allConfig.Backup = peer
			break
		}
	}

	return nil
}

func loadTLSConfig(mode string) (*tls.Config, error) {
	var certFile, keyFile string

	if mode == "primary" {
		certFile = strings.ReplaceAll(allConfig.Primary.Address, ".", "_") + ".pem"
		keyFile = strings.ReplaceAll(allConfig.Primary.Address, ".", "_") + ".key"
	}
	if mode != "primary" {
		for _, allowedPeer := range allConfig.Peers {
			if allowedPeer.Name == mode {
				certFile = strings.ReplaceAll(allowedPeer.Address, ".", "_") + ".pem"
				keyFile = strings.ReplaceAll(allowedPeer.Address, ".", "_") + ".key"
				break
			}
		}
	}
	if certFile == "" || keyFile == "" {
		log.Fatalf("No certificate files found for mode '%s'", mode)
	}

	// Load certificate
	if fileExists(certFile) && fileExists(keyFile) {
		return loadTLSConfigFromFiles(certFile, keyFile)
	}

	// No certificates found
	return nil, fmt.Errorf("no certificate files found for mode '%s'", mode)
}

func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}

func loadTLSConfigFromFiles(certFile, keyFile string) (*tls.Config, error) {
	// Load certificate and key from files
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load certificate: %v", err)
	}

	return &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      loadCertPool("./ca.pem"),
		ClientCAs:    loadCertPool("./ca.pem"),
		ClientAuth:   tls.RequireAndVerifyClientCert, // mutual TLS
		NextProtos:   []string{"sdo-quic"},
	}, nil
}

func loadCertPool(certFile string) *x509.CertPool {
	pool := x509.NewCertPool()
	caCert, err := os.ReadFile(certFile)
	if err != nil {
		log.Fatalf("Failed to read CA certificate: %v", err)
	}

	if !pool.AppendCertsFromPEM(caCert) {
		log.Fatal("Failed to append CA certificate to pool")
	}

	return pool
}
