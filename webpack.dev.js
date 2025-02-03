const { merge } = require( 'webpack-merge' );
const path = require( 'path' );
const common = require( './webpack.common.js' );

module.exports = merge( common, {
    mode: 'development',
    devtool: 'inline-source-map',
    optimization: {
        runtimeChunk: 'single',
    },
    watchOptions: {
        aggregateTimeout: 600, // Delay rebuilds after first change
        poll: true, // Check for changes every second
        ignored: /node_modules/ // Ignore unnecessary files
    },
    devServer: {
        static: path.resolve( __dirname, 'dist' ),
        hot: true,
        watchFiles: ['index.html', './assets/**/*', './sources/**/*'],
    }
    
} );