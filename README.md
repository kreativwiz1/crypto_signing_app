# Crypto Signing and Verification App 🔐

A web-based application that enables secure cryptographic signing and verification of messages and images using blockchain wallets. This application provides a user-friendly interface for digital content authentication through blockchain technology.

## ✨ Features

- **Wallet Integration**
  - 🦊 MetaMask support
  - Seamless connection flow
  - Account management

- **Network Support**
  - 🔷 Sepolia Testnet (Chain ID: 11155111)
  - 💜 Polygon Mainnet (Chain ID: 137)
  - Dynamic network switching

- **Cryptographic Operations**
  - Message signing
  - Signature verification
  - Image content signing
  - Hash verification

- **Content Management**
  - 📝 Text moderation
  - 🖼️ Image moderation
  - Upload progress tracking
  - Secure content storage

## 🛠️ Technologies

- **Blockchain Integration**
  - Web3.js v1.9.0
  - MetaMask provider

- **Cryptography**
  - CryptoJS for operations
  - RSA key generation
  - Secure hash functions

- **Security**
  - DOMPurify for XSS protection
  - Content validation
  - Secure upload handling

- **Image Processing**
  - Cloudinary integration
  - Progress tracking
  - Format validation

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-signing-app.git
cd crypto-signing-app
```

2. Open the application:
   - Open `index.html` in a modern web browser
   - Enable JavaScript if prompted

3. Connect your wallet:
   - Click "Connect Wallet"
   - Approve MetaMask connection
   - Select desired account

4. Select network:
   - Choose Sepolia Testnet or Polygon Mainnet
   - Confirm network switch in MetaMask

5. Start using the app:
   - Sign messages or images
   - Verify existing signatures
   - View transaction history

## 💻 Usage Guide

### Message Signing
```javascript
// Example of message signing
const message = "Hello, Blockchain!";
const signature = await signMessage(message);
```

### Signature Verification
```javascript
// Example of signature verification
const isValid = await verifySignature(message, signature, address);
```

### Image Signing
```javascript
// Example of image signing
const imageHash = await hashImage(imageFile);
const imageSignature = await signMessage(imageHash);
```

## 🔒 Security Features

### Content Moderation
- Text content validation
- Image content screening
- Size and format restrictions

### XSS Protection
```javascript
// Example of DOMPurify usage
const cleanContent = DOMPurify.sanitize(userInput);
```

### Cryptographic Security
```javascript
// Example of RSA key generation
const rsaKey = cryptico.generateRSAKey(seed, bits);
```

## 🌐 Network Configuration

### Sepolia Testnet
- Chain ID: 11155111
- RPC URL: https://sepolia.infura.io/v3/
- Currency Symbol: ETH

### Polygon Mainnet
- Chain ID: 137
- RPC URL: https://polygon-rpc.com
- Currency Symbol: MATIC

## 📁 Project Structure

```
crypto-signing-app/
├── index.html          # Main application interface
├── css/
│   └── styles.css      # Application styling
├── js/
│   ├── web3.min.js     # Web3 library
│   ├── crypto.js       # Cryptographic operations
│   └── app.js          # Main application logic
├── img/                # Application images
└── README.md          # Documentation
```

## ⚙️ Configuration

### Environment Setup
```javascript
const CONFIG = {
  SEPOLIA_CHAIN_ID: '0xaa36a7',
  POLYGON_CHAIN_ID: '0x89',
  CLOUDINARY_UPLOAD_URL: 'https://api.cloudinary.com/v1_1/your-cloud/upload'
};
```

## 🔍 Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| No Provider | MetaMask not detected | Install MetaMask |
| Wrong Network | Invalid network selected | Switch to supported network |
| Signature Failed | Message signing failed | Check wallet connection |

## 📊 Performance Considerations

- Optimal image size: < 5MB
- Supported formats: JPG, PNG, GIF
- Transaction confirmation time varies by network

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### Development Guidelines
- Follow JavaScript Standard Style
- Add comments for complex operations
- Include tests for new features
- Update documentation

## 📮 Support

For support:
- Open an issue in the GitHub repository
- Check existing documentation
- Join our community Discord

## 🙏 Acknowledgments

- MetaMask team for wallet integration
- Web3.js developers
- Cloudinary for image hosting
- Open source cryptography community