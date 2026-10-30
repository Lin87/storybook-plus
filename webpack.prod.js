const { merge } = require( 'webpack-merge' );
const common = require( './webpack.common.js' );
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = merge( common, {

    mode: 'production',
    devtool: 'source-map',
    optimization: {
        minimizer: [
          new TerserPlugin( 
            {
              extractComments: false,
              terserOptions: {
                keep_classnames: true,
                keep_fnames: true
              },
            }
          ),
          // Keep modern relative-color calculations intact for the browser.
          new CssMinimizerPlugin({ minimizerOptions: { preset: ['default', { calc: false }] } }),
        ],
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    
} );
