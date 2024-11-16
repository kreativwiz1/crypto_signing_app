const TEXT_MODERATION_API_URL = "https://flask-content-guard-kreativwiz.replit.app/moderate";
const IMAGE_MODERATION_API_URL = "https://rotating-wiry-declaration-kreativwiz.replit.app/upload";

const contractAddresses = {
    "137": "0x5669Ac4951cCDE4e2bEdE1fc96681F15E3F015D1", // Polygon
    "11155111": "0xc1620929B151ecB45beB7093AfFb1F9A359656d9" // Sepolia
};

const tokens = {
    "137": [
        {
            address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            token: "POL",
            image: "matic.png",
            decimals: "18"
        },
        {
            address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            token: "DAI",
            image: "dai.png",
            decimals: "18"
        }
    ],
    "11155111": [
        {
            address: "0xA66857Da8d75BE2363968a3B01BfE1f417B28202",
            token: "ETH",
            image: "eth.png",
            decimals: "18"
        }
    ]
};

const cost = "1000000000000000"; // Reduced by a factor of 10
