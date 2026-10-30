const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: {
        sbplus: path.resolve(__dirname, './sources/scripts/sbplus-dev.js'),
    },
    output: {
        filename: 'sources/scripts/[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.mjs'],
        alias: { '@': path.resolve(__dirname, 'sources') },
    },
    module: {
        rules: [
            { test: /\.ts$/, exclude: /node_modules/, use: 'ts-loader' },
            { test: /\.html$/, include: path.resolve(__dirname, 'sources/components'), type: 'asset/source' },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {},
                },
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                        },
                    },
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            // Prefer `dart-sass`
                            implementation: require('sass'),
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
            filename: path.resolve(__dirname, 'dist', 'index.html'),
            chunks: ['sbplus'],
            inject: false,
            links: [
                'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap',
                'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=add_circle,check,chevron_backward,chevron_forward,close,close_fullscreen,cognition_2,content_copy,do_not_disturb_on,download,forward_10,info,list,more_horiz,notes,open_in_full,person,replay_10,settings,warning&display=swap',
            ],
        }),
        new CopyWebpackPlugin({
            patterns: [
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
                    from: 'sources/manifest.json',
                    to: 'sources',
                },
                {
                    from: 'sources/scripts/libs',
                    to: 'sources/scripts/libs',
                },
                {
                    from: 'sources/scripts/templates',
                    to: 'sources/scripts/templates',
                },
            ],
        }),
        new MiniCssExtractPlugin({
            filename: 'sources/css/[name].css',
        }),
    ],
};
