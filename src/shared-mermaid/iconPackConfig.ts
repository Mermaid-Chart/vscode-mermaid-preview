export const iconPackConfig = [
    {
        prefix: 'logos',
        pack: '@iconify-json/logos',
    },
    {
        prefix: 'mdi',
        pack: '@iconify-json/mdi',
    }
];

export const requireIconPack = (prefix: string) => {
    if (prefix === 'logos') {
        return import('@iconify-json/logos');
    } else if (prefix === 'mdi') {
        return import('@iconify-json/mdi');
    } else {
        throw new Error(`Unknown prefix: ${prefix}`);
    }
};