console.log("TEXT_MODERATION_API_URL:", TEXT_MODERATION_API_URL);
console.log("IMAGE_MODERATION_API_URL:", IMAGE_MODERATION_API_URL);

const cloudinaryConfig = {
    cloudName: 'dkbn3idlv',
    apiKey: '194678218652521',
    apiSecret: 'SipFyYGskbGWviHs2AWvsT7KWQY'
};

const parseAndValidateRequest = (requestString) => {
  try {
    const parsedRequest = JSON.parse(requestString);

    const requiredFields = ['address', 'chain', 'hash', 'publicKey', 'message'];
    const missingFields = requiredFields.filter(field => !(field in parsedRequest));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(parsedRequest.address)) {
      throw new Error('Invalid Ethereum address format');
    }

    if (typeof parsedRequest.chain !== 'string' || isNaN(parseInt(parsedRequest.chain))) {
      throw new Error('Chain must be a string representing a number');
    }

    const supportedChainIDs = ["137", "11155111"];
    if (!supportedChainIDs.includes(parsedRequest.chain)) {
      throw new Error(`Unsupported chain ID: ${parsedRequest.chain}`);
    }

    return parsedRequest;
  } catch (error) {
    console.error('Error parsing or validating request:', error.message);
    return null;
  }
};

let userAddress;
let web3;
let chainID = "11155111";
let DDEcontract;

function decodeHtmlEntities(text) {
    var textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            document.getElementById('wallet-status').textContent = 'Connected: ' + userAddress;
            await updateNetwork();
        } catch (error) {
            console.error("Failed to connect to wallet:", error);
        }
    } else {
        console.error('MetaMask not detected');
    }
}

async function updateNetwork() {
    chainID = document.getElementById('network-select').value;
    console.log("Attempting to update network to chain ID:", chainID);
    
    if (typeof window.ethereum === 'undefined') {
        console.error('MetaMask not detected');
        return;
    }

    try {
        web3 = new Web3(window.ethereum);
        console.log("Web3 initialized:", web3);

        const networkData = {
            "137": {
                chainId: `0x${Number(137).toString(16)}`,
                chainName: "Polygon Mainnet",
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                rpcUrls: ["https://rpc.ankr.com/polygon"],
                blockExplorerUrls: ["https://polygonscan.com/"]
            },
            "11155111": {
                chainId: `0x${Number(11155111).toString(16)}`,
                chainName: "Sepolia Testnet",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.ankr.com/eth_sepolia"],
                blockExplorerUrls: ["https://sepolia.etherscan.io/"]
            }
        };

        if (!networkData[chainID]) {
            throw new Error(`Unsupported chain ID: ${chainID}`);
        }

        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: networkData[chainID].chainId }],
        });

        const currentChainId = await web3.eth.getChainId();
        console.log("Current chain ID after switch:", currentChainId);

        if (currentChainId.toString() !== chainID) {
            throw new Error(`Network switch failed. Expected ${chainID}, got ${currentChainId}`);
        }

        const contractAddress = contractAddresses[chainID];
        if (!contractAddress) {
            throw new Error(`No contract address found for chain ID: ${chainID}`);
        }
        DDEcontract = new web3.eth.Contract(DDEabi, contractAddress);
        console.log("Contract initialized for chain ID:", chainID);

        const accounts = await web3.eth.getAccounts();
        userAddress = accounts[0];
        console.log("User address updated:", userAddress);

    } catch (switchError) {
        console.error("Error during network switch:", switchError);

        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [networkData[chainID]],
                });
                await updateNetwork();
            } catch (addError) {
                console.error('Failed to add the network:', addError);
                alert(`Failed to add the network: ${addError.message}`);
                return;
            }
        } else {
            console.error('Failed to switch network:', switchError);
            alert(`Failed to switch network: ${switchError.message}`);
            return;
        }
    }

    console.log("Network updated successfully. Current chain ID:", chainID);
    document.getElementById('network-select').value = chainID;
}

async function uploadToCloudinary(file) {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
        throw new Error('Cloudinary configuration is missing. Please set cloudName, apiKey, and apiSecret in cloudinaryConfig.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', cloudinaryConfig.apiKey);
    formData.append('timestamp', Math.floor(Date.now() / 1000));

    const signature = generateSignature(formData.get('timestamp'));
    formData.append('signature', signature);

    try {
        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, true);
            
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    updateProgressBar(percentComplete);
                }
            };

            xhr.onload = function() {
                if (this.status === 200) {
                    const response = JSON.parse(this.responseText);
                    resolve(response.secure_url);
                } else {
                    reject(new Error(`HTTP error! status: ${this.status}`));
                }
            };

            xhr.onerror = function() {
                reject(new Error('Network error occurred'));
            };

            xhr.send(formData);
        });

        const url = await uploadPromise;
        updateUploadStatus('Upload successful!', 'upload-success');
        return url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        updateUploadStatus(`Upload failed: ${error.message}`, 'upload-error');
        throw new Error('Failed to upload image to Cloudinary. Please try again.');
    }
}

function generateSignature(timestamp) {
    const stringToSign = `timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
    return CryptoJS.SHA1(stringToSign).toString();
}

function updateProgressBar(percent) {
    const progressBar = document.querySelector('#upload-progress .progress');
    progressBar.style.width = `${percent}%`;
}

function updateUploadStatus(message, className) {
    const statusElement = document.getElementById('upload-status');
    statusElement.textContent = message;
    statusElement.className = className;
}

function resetUploadUI() {
    updateProgressBar(0);
    updateUploadStatus('', '');
    document.getElementById('image-preview').innerHTML = '';
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        resetUploadUI();
        const reader = new FileReader();
        const previewArea = document.getElementById('image-preview');

        reader.onload = async function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            
            previewArea.innerHTML = '';
            previewArea.appendChild(img);

            try {
                const cloudinaryUrl = await uploadToCloudinary(file);
                previewArea.setAttribute('data-url', cloudinaryUrl);
                console.log('Image uploaded to Cloudinary:', cloudinaryUrl);
            } catch (error) {
                console.error('Error uploading to Cloudinary:', error);
            }
        }
        reader.readAsDataURL(file);
    }
}

async function signRequest() {
    if (!userAddress) {
        alert('Please connect your wallet first');
        return;
    }
    var request = {};
    request.address = userAddress;
    request.chain = chainID;
    const requestToSign = document.getElementById("sign-input").value;
    const imagePreview = document.getElementById("image-preview");
    const cloudinaryUrl = imagePreview.getAttribute('data-url');
    
    let contentToSign = requestToSign;
    if (cloudinaryUrl) {
        contentToSign = cloudinaryUrl;
    }
    
    console.log("Signing request:", contentToSign);
    request.hash = CryptoJS.SHA256(contentToSign).toString();

    var userPrivateKey = CryptoJS.SHA256(userAddress).toString();
    for (var i = 1; i < 50000; i++) {
        userPrivateKey = CryptoJS.SHA256(userPrivateKey).toString();
    }
    var userEncryptionKey = cryptico.generateRSAKey(userPrivateKey, 1024);
    var userPublicKey = cryptico.publicKeyString(userEncryptionKey);

    var serverPrivateKey = CryptoJS.SHA256("$123anotherLongPasswordABC$").toString();
    for (var i = 1; i < 50000; i++) {
        serverPrivateKey = CryptoJS.SHA256(serverPrivateKey).toString();
    }
    var serverEncryptionKey = cryptico.generateRSAKey(serverPrivateKey, 1024);
    var serverPublicKey = cryptico.publicKeyString(serverEncryptionKey);

    request.publicKey = userPublicKey;
    const timestamp = new Date().getTime();
    const padding = CryptoJS.SHA256(timestamp.toString()).toString().substring(0, 16);
    var finalMessage = cryptico.encrypt(contentToSign + "#*#*#" + timestamp + padding, serverPublicKey, userEncryptionKey).cipher;
    request.message = finalMessage;

    console.log("Final signed request:", JSON.stringify(request, null, 2));
    return request;
}

async function verifyRequest(request = '') {
    console.log("Verifying request:", request);
    const requestToVerify = document.getElementById("verify-input").value;
    if (request === '') {
        request = requestToVerify;
    }
    
    const parsedRequest = parseAndValidateRequest(request);
    if (!parsedRequest) {
        return { 'false': 'Invalid request format' };
    }

    console.log("Parsed and validated request:", parsedRequest);

    let currentWeb3;
    let currentContract;
    try {
        if (parsedRequest.chain === "137") {
            currentWeb3 = new Web3("https://rpc.ankr.com/polygon");
        } else if (parsedRequest.chain === "11155111") {
            currentWeb3 = new Web3("https://rpc.ankr.com/eth_sepolia");
        } else {
            throw new Error("Unsupported chain ID");
        }
        const contractAddress = contractAddresses[parsedRequest.chain];
        if (!contractAddress) {
            throw new Error(`No contract address found for chain ID: ${parsedRequest.chain}`);
        }
        currentContract = new currentWeb3.eth.Contract(DDEabi, contractAddress);
        console.log("Web3 instance and contract initialized for chain ID:", parsedRequest.chain);
    } catch (error) {
        console.error("Error initializing Web3 or contract:", error);
        return { 'false': 'Failed to initialize Web3 or contract' };
    }

    var userData = JSON.parse(localStorage.getItem(parsedRequest.address + ':userdata')) || {
        'requests': {},
        'startTime': Math.floor(Date.now() / 1000),
        'minBalance': {}
    };

    const currentContractAddress = contractAddresses[parsedRequest.chain];
    if (!userData.requests[currentContractAddress]) {
        userData.requests[currentContractAddress] = '0';
        userData.minBalance[currentContractAddress] = '0';
    }

    console.log("User data before processing:", JSON.stringify(userData, null, 2));
    console.log("Current cost value:", cost);

    var baseBalance;
    try {
        console.log("Fetching base balance for user address:", parsedRequest.address);
        baseBalance = await currentWeb3.eth.getBalance(parsedRequest.address);
        baseBalance = new currentWeb3.utils.BN(DOMPurify.sanitize(baseBalance));
        console.log("Base balance for address", parsedRequest.address, ":", baseBalance.toString());
    } catch (error) {
        console.error("Error fetching base balance for address", parsedRequest.address, ":", error);
        return { 'false': 'Failed to fetch user balance' };
    }

    try {
        console.log("Fetching token balance for user address:", parsedRequest.address, "and contract address:", currentContractAddress);
        const liquid = await currentContract.methods.userBalance(parsedRequest.address, currentContractAddress).call();
        var tokenBalance = new currentWeb3.utils.BN(DOMPurify.sanitize(liquid));
        console.log("Token balance for address", parsedRequest.address, ":", tokenBalance.toString());
        baseBalance = baseBalance.add(tokenBalance);
        console.log("Total balance (base + token) for address", parsedRequest.address, ":", baseBalance.toString());

        const buffer = baseBalance.mul(new currentWeb3.utils.BN('5')).div(new currentWeb3.utils.BN('100'));
        const bufferedBalance = baseBalance.add(buffer);

        console.log("Current minBalance for contract", currentContractAddress, ":", userData.minBalance[currentContractAddress]);
        if (bufferedBalance.gt(new currentWeb3.utils.BN(userData.minBalance[currentContractAddress]))) {
            userData.minBalance[currentContractAddress] = bufferedBalance.toString();
            console.log("Updated minBalance with buffer for contract", currentContractAddress, ":", userData.minBalance[currentContractAddress]);
        }
    } catch (error) {
        console.error("Error fetching token balance for address", parsedRequest.address, "and contract", currentContractAddress, ":", error);
        return { 'false': 'Failed to fetch token balance' };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > userData.startTime + 604800) {
        Object.keys(userData.requests).forEach(key => {
            userData.requests[key] = '0';
        });
        userData.startTime = currentTime;
        console.log("Weekly reset: Requests reset to 0");
    }

    console.log("Current requests for contract:", userData.requests[currentContractAddress]);
    console.log("Current minBalance for contract:", userData.minBalance[currentContractAddress]);

    const currentRequests = new currentWeb3.utils.BN(userData.requests[currentContractAddress]);
    const currentMinBalance = new currentWeb3.utils.BN(userData.minBalance[currentContractAddress]);

    console.log("Comparison - Current requests:", currentRequests.toString());
    console.log("Comparison - Current minBalance:", currentMinBalance.toString());

    if (currentRequests.gt(currentMinBalance)) {
        console.log("Too many requests: requests > minBalance");
        return { 'false': 'Too many requests, try again later' };
    }

    userData.requests[currentContractAddress] = currentRequests.add(new currentWeb3.utils.BN(cost)).toString();
    console.log("Updated requests for contract:", userData.requests[currentContractAddress]);

    console.log("User data after processing:", JSON.stringify(userData, null, 2));

    var serverPrivateKey = CryptoJS.SHA256("$123anotherLongPasswordABC$").toString();
    for (var i = 1; i < 50000; i++) {
        serverPrivateKey = CryptoJS.SHA256(serverPrivateKey).toString();
    }
    var serverEncryptionKey = cryptico.generateRSAKey(serverPrivateKey, 1024);

    try {
        console.log("Server Private Key (first 10 chars):", serverPrivateKey.substring(0, 10));
        console.log("Server Encryption Key (public part):", cryptico.publicKeyString(serverEncryptionKey));

        console.log("Attempting to decrypt message:", parsedRequest.message);
        var decrypted = cryptico.decrypt(parsedRequest.message, serverEncryptionKey);
        console.log("Full decrypted object:", decrypted);

        if (decrypted.status !== "success") {
            throw new Error("Decryption failed: " + decrypted.status);
        }

        var message = decrypted.plaintext;
        console.log("Decrypted message:", message);

        var parts = message.split("#*#*#");
        if (parts.length !== 2) {
            throw new Error("Invalid message format: expected 2 parts, got " + parts.length);
        }

        var originalMessage = parts[0];
        var padding = parts[1];

        console.log("Original message:", originalMessage);
        console.log("Padding:", padding);
        console.log("Padding length:", padding.length);

        if (padding.length < 25) {
            throw new Error("Incorrect padding: length is " + padding.length + ", expected at least 25");
        }

        if (decrypted.signature !== "verified") {
            throw new Error("Signature verification failed");
        }

        const computedHash = CryptoJS.SHA256(originalMessage).toString();
        console.log("Computed hash:", computedHash);
        console.log("Received hash:", parsedRequest.hash);
        if (computedHash !== parsedRequest.hash) {
            throw new Error("Hash mismatch: computed " + computedHash + ", received " + parsedRequest.hash);
        }

        const moderationResult = await moderateContent(originalMessage);

        console.log("Moderation Result:", moderationResult);

        if (moderationResult.error) {
            console.warn("Moderation warning:", moderationResult.message);
        }

        localStorage.setItem(parsedRequest.address + ':userdata', JSON.stringify(userData));
        return { 
            'true': originalMessage, 
            'moderation': moderationResult,
            'warning': moderationResult.error ? moderationResult.message : null
        };
    } catch (e) {
        console.error("Detailed error in message decryption or verification:", e);
        return { 'false': 'Failed to decrypt or verify message: ' + e.message };
    }
}

async function moderateContent(content) {
    console.log("Moderating content:", content);
    try {
        if (!TEXT_MODERATION_API_URL || !IMAGE_MODERATION_API_URL) {
            throw new Error("Moderation API URLs are not defined");
        }

        const isImageUrl = (string) => {
            const imageUrlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp)|data:image\/.*;base64,)/i;
            return imageUrlPattern.test(string);
        };

        let apiUrl, body;
        if (isImageUrl(content)) {
            console.log("Content is an image URL, using IMAGE_MODERATION_API_URL");
            apiUrl = IMAGE_MODERATION_API_URL;
            body = JSON.stringify({ url: content });
        } else {
            console.log("Content is text, using TEXT_MODERATION_API_URL");
            apiUrl = TEXT_MODERATION_API_URL;
            body = JSON.stringify({ text: content });
        }

        console.log("Sending request to:", apiUrl);
        console.log("Request body:", body);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            body: body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Full error response:", errorText);
            if (response.status === 0) {
                throw new Error("Network error: Unable to access the moderation API. Please check your internet connection.");
            }
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log("Moderation result:", result);
        return result;
    } catch (error) {
        console.error("Error in content moderation:", error);
        return { 
            error: `Failed to moderate content: ${error.message}`,
            isSafe: false,
            message: "Content moderation failed. The content may not be safe."
        };
    }
}

async function handleSignRequest() {
    const request = await signRequest();
    document.getElementById('sign-output').textContent = JSON.stringify(request, null, 2);
}

async function handleVerifyRequest() {
    const requestToVerify = document.getElementById("verify-input").value;
    try {
        const result = await verifyRequest(requestToVerify);
        document.getElementById('verify-output').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        console.error("Error during verification:", error);
        document.getElementById('verify-output').textContent = "Error: " + error.message;
    }
}

document.getElementById('connect-wallet').addEventListener('click', connectWallet);
document.getElementById('sign-button').addEventListener('click', handleSignRequest);
document.getElementById('verify-button').addEventListener('click', handleVerifyRequest);
document.getElementById('network-select').addEventListener('change', updateNetwork);
document.getElementById('image-upload').addEventListener('change', handleImageUpload);

updateNetwork();