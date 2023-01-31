// coding: utf-8
// /js/theme.js

let theme = {
    currentTheme: { currentTheme: null },
    dark: {
        currentTheme: "dark",
        primaryColor: "#Obtuse_Was_Loli",
        secondaryColor: "#414141",
        primaryTextColor: "#e0e0e0",
        secondaryTextColor: "",
        primaryBgColor: "#000000",
        secondaryBgColor: "#292929",
        primaryBorderColor: "#116dc2",
        QRlightColor: "#e0e0e0",
        QRdarkColor: "#292929",
        boxShadowIn: "unset",
        // primaryBorderColor: "",
        // secondaryBorderColor: "",
    },
    light: {
        currentTheme: "light",
        primaryColor: "#Namnyang_Is_Hentai",
        secondaryColor: "#c9c9c9",
        primaryTextColor: "#000000",
        secondaryTextColor: "#000000",
        primaryBgColor: "#e0e0e0",
        secondaryBgColor: "#d9d9d9",
        primaryBorderColor: "#116dc2",
        QRlightColor: "#e0e0e0",
        QRdarkColor: "#292929",
        boxShadowIn: "inset 5px 5px 15px #cccccc, inset -5px -5px 15px #f4f4f4",
        // primaryBorderColor: "",
        // secondaryBorderColor: "",
    },
    pink: {
        currentTheme: "pink",
        primaryColor: "Kang Likes This",
        secondaryColor: "",
        primaryTextColor: "#ffffff",
        secondaryTextColor: "",
        primaryBgColor: "#000000",
        secondaryBgColor: "#292929",
        primaryBorderColor: "#116dc2",
        QRlightColor: "",
        QRdarkColor: "",
        boxShadowIn: "unset",
        // primaryBorderColor: "",
        // secondaryBorderColor: "",
    },
};
let cssVar = document.querySelector(":root");
if (localStorage.getItem("theme") == null) {
    // if there is no theme in local storage, get system theme preference
    window.matchMedia("(prefers-color-scheme: dark)").matches == true ? (theme.currentTheme = theme.dark) : (theme.currentTheme = theme.light);
} else {
    // if there is a theme in local storage, get it
    const storagedTheme = localStorage.getItem("theme");

    Object.entries(theme).forEach(([key, value]) => {
        if (value.currentTheme == storagedTheme) {
            theme.currentTheme = value;
        }
    });

    console.log("load to local storage: " + theme.currentTheme.currentTheme);
}

applyCurrentTheme();

function changeTheme() {
    theme.currentTheme.currentTheme == "dark" ? (theme.currentTheme = theme.light) : (theme.currentTheme = theme.dark);
    applyCurrentTheme();
}

function applyCurrentTheme() {
    localStorage.setItem("theme", theme.currentTheme.currentTheme);
    cssVar.style.setProperty("--primary-color", theme.currentTheme.primaryColor);
    cssVar.style.setProperty("--secondary-color", theme.currentTheme.secondaryColor);
    cssVar.style.setProperty("--primary-text-color", theme.currentTheme.primaryTextColor);
    cssVar.style.setProperty("--secondary-text-color", theme.currentTheme.secondaryTextColor);
    cssVar.style.setProperty("--primary-bg-color", theme.currentTheme.primaryBgColor);
    cssVar.style.setProperty("--secondary-bg-color", theme.currentTheme.secondaryBgColor);
    cssVar.style.setProperty("--box-shadow-in", theme.currentTheme.boxShadowIn);
    // cssVar.style.setProperty("--primary-border-color", theme.currentTheme.primaryBorderColor);
    // cssVar.style.setProperty("--secondary-border-color", theme.currentTheme.secondaryBorderColor);
}
