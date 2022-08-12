require('dotenv').config()

// Intiate Web3 connection
const Web3 = require('web3')
const web3 = new Web3(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`) // Replace this with a websocket connection to your alchemy node to monitor mainnet

const IUniswapV2Factory = require("@uniswap/v2-core/build/IUniswapV2Factory.json")
const IUniswapV2Router02 = require('@uniswap/v2-periphery/build/IUniswapV2Router02.json')
const IUniswapV2Pair = require('@uniswap/v2-core/build/IUniswapV2Pair.json')
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json')


const uFactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
const uRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

const uFactory = new web3.eth.Contract(IUniswapV2Factory.abi, uFactoryAddress)
const uRouter = new web3.eth.Contract(IUniswapV2Router02.abi, uRouterAddress)
const WETH = new web3.eth.Contract(IERC20.abi, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

const AMOUNT = '0.02' // How much WETH are you willing to spend on new tokens?
const SLIPPAGE = 0.05 // 5% Slippage

//for saving results to file
var fs = require('fs');

const main = async () => {

    const [deployer, sniper] = await web3.eth.getAccounts()
    // TODO: perhaps create dynamic test file counter or something
    let logCount = 0
    // Create event listener to listen to PairCreated
    uFactory.events.PairCreated({}, async (error, event) => {
        console.log(`New pair detected...\n`)
        const { token0, token1, pair } = event.returnValues
        console.log(`Token0: ${token0.toLowerCase()}`)
        console.log(`Token1: ${token1.toLowerCase()}`)
        console.log(`Pair Address: ${pair.toLowerCase()}\n`)
        const res = `Token0: ${token0.toLowerCase()}\nToken1: ${token1.toLowerCase()}\nPair Address: ${pair.toLowerCase()}\n--------\n`
        // Since we are buying this new token with WETH, we want to verify token0 & token1 address, and fetch the address of the new token?
        let path = []
        if (token0 === WETH._address) {
            path = [token0, token1]
        }
        if (token1 === WETH._address) {
            path = [token1, token0]
        }
        if (path.length === 0) {
            console.log(`Pair wasn\'t created with WETH...\n`)
            return
        }
        const uPair = new web3.eth.Contract(IUniswapV2Pair.abi, pair)
        const token = new web3.eth.Contract(IERC20.abi, path[1]) // Path[1] will always be the token we are buying.
        console.log(`Checking liquidity...\n`)
        // Ideally you'll probably want to take a closer look at reserves, and price from the pair address
        // to determine if you want to snipe this particular token...
        const reserves = await uPair.methods.getReserves().call()
        if (reserves[0] == 0 && reserves[1] == 0) {
            console.log(`Token has no liquidity...`)
            return
        }
        //Write results to file
        fs.writeFile(`test${logCount}`, res, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
        logCount += 1;
    })
    console.log(`Listening for new pairs...\n`)
}

main()
