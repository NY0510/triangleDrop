// coding: utf-8
// /js/theme.js

let theme = {
    currentTheme: { currentTheme: null },
    dark: {
        currentTheme: "dark",
        primaryColor: "",
        secondaryColor: "#414141",
        primaryTextColor: "#e0e0e0",
        secondaryTextColor: "#838383",
        primaryBgColor: "#000000",
        secondaryBgColor: "#292929",
        primaryBorderColor: "#116dc2",
        QRlightColor: "#e0e0e0",
        QRdarkColor: "#292929",
        boxShadowIn: "unset",
        boxShadowFlat: "unset",
        codeGradient: "linear-gradient(45deg, #9857ff, #5af6ff)",
        primaryBgColorNext: "#e0e0e0",
        // primaryBorderColor: "",
        // secondaryBorderColor: "",
    },
    light: {
        currentTheme: "light",
        primaryColor: "#Namnyang_Is_Hentai",
        secondaryColor: "#c9c9c9",
        primaryTextColor: "#000000",
        secondaryTextColor: "#818181",
        primaryBgColor: "#e0e0e0",
        secondaryBgColor: "#d9d9d9",
        primaryBorderColor: "#116dc2",
        QRlightColor: "#e0e0e0",
        QRdarkColor: "#292929",
        boxShadowIn: "inset 5px 5px 15px #cccccc, inset -5px -5px 15px #f4f4f4",
        boxShadowFlat: "15px 15px 30px #989898, -15px -15px 30px #ffffff",
        codeGradient: "linear-gradient(45deg, #9857ff, #5af6ff)",
        primaryBgColorNext: "#FF469F",
        // primaryBorderColor: "",
        // secondaryBorderColor: "",
    },
    pink: {
        currentTheme: "pink",
        primaryColor: "Kang Likes This",
        secondaryColor: "#f28cbf",
        primaryTextColor: "#56092e",
        secondaryTextColor: "#604754",
        primaryBgColor: "#FF469F",
        secondaryBgColor: "#FF9FCD",
        primaryBorderColor: "#FF006E",
        QRlightColor: "#FF9FCD",
        QRdarkColor: "#56092e",
        boxShadowIn: "unset",
        boxShadowFlat: "unset",
        codeGradient: "linear-gradient(45deg, #9857ff, #eb569d)",
        primaryBgColorNext: "#000000",
        // primaryBorderColor: "",
        // secondaryBorderColor: "",
    },
};

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

let cssVar;

window.onload = function () {
    cssVar = document.querySelector(":root");
    applyCurrentTheme();
    document.querySelector(".themeToggleButton").addEventListener("click", changeTheme);
};

function changeTheme() {
    // theme.currentTheme.currentTheme == "dark" ? (theme.currentTheme = theme.light) : (theme.currentTheme = theme.dark);
    theme.currentTheme.currentTheme == "dark"
        ? (theme.currentTheme = theme.light)
        : theme.currentTheme.currentTheme == "light"
        ? (theme.currentTheme = theme.pink)
        : (theme.currentTheme = theme.dark);

    document.querySelector(".themeToggleButton").classList.add("activate");

    setTimeout(() => {
        if (theme.currentTheme.currentTheme == "dark" || theme.currentTheme.currentTheme == "pink") {
            document.querySelector(".codeQRcode").style = "";
            document.querySelector(".codeQRcode").innerHTML = "";
            qrCode = new QRCode($codeQRcode, {
                text: `https://triangledrop.obtuse.kr/?code=${roomName}`,
                width: 130,
                height: 130,
                colorDark: theme.currentTheme.QRdarkColor,
                colorLight: theme.currentTheme.QRlightColor,
                correctLevel: QRCode.CorrectLevel.Q,
            });
        }
        applyCurrentTheme();
    }, 280);
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
    cssVar.style.setProperty("--box-shadow-flat", theme.currentTheme.boxShadowFlat);
    cssVar.style.setProperty("--code-gradient", theme.currentTheme.codeGradient);
    cssVar.style.setProperty("--primary-bg-color-next", theme.currentTheme.primaryBgColorNext);
    // cssVar.style.setProperty("--primary-border-color", theme.currentTheme.primaryBorderColor);
    // cssVar.style.setProperty("--secondary-border-color", theme.currentTheme.secondaryBorderColor);
    document.querySelector(".themeToggleButton").classList.remove("activate");
}
