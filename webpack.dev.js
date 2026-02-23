const { merge } = require( 'webpack-merge' );
const path = require( 'path' );
const common = require( './webpack.common.js' );
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge( common, {
    mode: 'development',
    devtool: 'source-map',
    optimization: {
        runtimeChunk: 'single',
    },
    devServer: {
        static: path.resolve( __dirname, 'dist' ),
        hot: true,
        watchFiles: ['index.html', './assets/**/*', './sources/**/*'],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'sbplus.*',
                }
            ],
        }),
    ],
    
} );