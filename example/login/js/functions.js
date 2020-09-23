function isGoodResponse(json) {
    if (json.error !== undefined && json.error.state !== undefined && json.error.state) {
        alert(json.error.title + "\n" + json.error.message); // replace to your own implementation
        return false;
    }
    return true;
}

//------------------------------------------------------------------------------------------------------------
//this is unnecessary code. It must be generated on server side. Read below... Only one language must be here.
//------------------------------------------------------------------------------------------------------------
var translates = {
    en: {
        login: "User name",
        password: "Password",
        submit: "LogIn",
        header: "Website Title",
        logo: "Company Name",
        remember: "Remember me"
    },
    fr: {
        login: "Nom d'utilisateur",
        password: "Mot de passe",
        submit: "S'identifier",
        header: "Titre du site Web",
        logo: "Nom de la compagnie",
        remember: "Souviens-toi de moi"
    },
    ru: {
        login: "Имя пользователя",
        password: "Пароль",
        submit: "Вход",
        header: "Заголовок Сайта",
        logo: "Имя компании",
        remember: "Запомнить меня"
    },
    es: {
        login: "Nombre de usuario",
        password: "Contraseña",
        submit: "Iniciar sesión",
        header: "Título del sitio web",
        logo: "nombre de empresa",
        remember: "Recuérdame"
    },
    de: {
        login: "Benutzername",
        password: "Passwort",
        submit: "Anmelden",
        header: "Website-Titel",
        logo: "Firmenname",
        remember: "Login speichern"
    }
};