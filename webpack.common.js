const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const WebpackConcatPlugin = require( 'webpack-concat-files-plugin' );
const terser = require('terser');

module.exports = {

    entry: {
        sbplus: path.resolve(__dirname, './sources/scripts/sbplus-dev.js'),
    },
    output: {
        filename: 'sources/scripts/[name].js',
        path: path.resolve( __dirname, 'dist' ),
        clean: true,
    },
    module: {

        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {}
                }
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                        }
                    },
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                          // Prefer `dart-sass`
                          implementation: require.resolve('sass'),
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin( {
            template: 'index.html',
            filename: path.resolve( __dirname, 'dist', 'index.html' ),
            chunks: [ 'sbplus' ],
            links: [
                'sources/scripts/libs/modernizr.js',
                'sources/scripts/libs/videojs/video-js.min.css',
                'sources/scripts/libs/videojs/video.min.js',
            ],
        } ),
        new CopyWebpackPlugin( {
            patterns: [
                {
                    from: 'sbplus.*',
                },
                {
                    from: 'assets',
                    to: 'assets',
                },
                {
                    from: 'sources/manifest.json',
                    to: 'sources/manifest.json',
                },
                {
                    from: 'sources/images',
                    to: 'sources/images',
                },
                {
                    from: 'sources/fonts',
                    to: 'sources/fonts',
                },
                {
                    from: 'sources/manifest.json',
                    to: 'sources',
                },
                {
                    from: 'sources/scripts/libs',
                    to: 'sources/scripts/libs',
                    globOptions: {
                        ignore: [ "**/videojs/plugins/**" ],
                    },
                },
                {
                    from: 'sources/scripts/templates',
                    to: 'sources/scripts/templates',
                },
            ],
        } ),
        new WebpackConcatPlugin({
            bundles: [
              {
                dest: './dist/sources/scripts/libs/videojs/video.min.js',
                src: [
                    './sources/scripts/libs/videojs/video.min.js',
                    './sources/scripts/libs/videojs/plugins/quality-selector/quality-selector.js',
                    './sources/scripts/libs/videojs/plugins/cuepoint/videojs.cuepoints.js',
                    './sources/scripts/libs/videojs/plugins/markers/videojs-markers.js',
                    './sources/scripts/libs/videojs/plugins/youtube/youtube.js',
                ],
                transforms: {
                    after: async (code) => {
                      const minifiedCode = await terser.minify(code, {keep_fnames: true, keep_classnames: true});
                      return minifiedCode.code;
                    },
                },
              },
            ],
        }),
        new MiniCssExtractPlugin({
            filename: 'sources/css/[name].css',
        } ),
    ],

};