module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
    },
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    'overrides': [],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module',
    },
    'plugins': [
        '@typescript-eslint',
    ],
    'ignorePatterns': [
        'lib/**/*.d.ts',
        'lib/**/*.js',
    ],
    'rules': {
        'indent': [
            'error',
            4,
            {SwitchCase: 1},
        ],
        'linebreak-style': [
            'error',
            'unix',
        ],
        'quotes': [
            'error',
            'single',
            {avoidEscape: true},
        ],
        'semi': [
            'error',
            'never',
        ],
        '@typescript-eslint/no-explicit-any': 0,
        'comma-dangle': ['error', 'always-multiline'],
    },
}
