require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || ""

module.exports = {
    solidity: {
        compilers: [
            { version: "0.8.9" },
            { version: "0.6.6" },
            { version: "0.6.12" },
            { version: "0.4.19" },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
        goerli: {
            url: GOERLI_RPC_URL || "",
            accounts: [PRIVATE_KEY, PRIVATE_KEY_2],
            chainId: 5,
            blockConfirmations: 2,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "MATIC",
    },
    mocha: {
        timeout: 10000000,
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
}
