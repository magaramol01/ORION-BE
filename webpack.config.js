const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        server: './src/app.js',
    },
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'index.js'
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new JavaScriptObfuscator({
            rotateUnicodeArray: true
        })
    ]
};
