function isGoodResponse(json) {
    if (json.error !== undefined && json.error.state !== undefined && json.error.state) {
        jth.translate(json, ['title', 'ui_*']);
        alert(json.error.title + "\n" + json.error.message); // replace to your own implementation
        alert(json.error.ui_optional_value);
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
        remember: "Remember me",
        error: "Error_test"
    },
    fr: {
        login: "Nom d'utilisateur",
        password: "Mot de passe",
        submit: "S'identifier",
        header: "Titre du site Web",
        logo: "Nom de la compagnie",
        remember: "Souviens-toi de moi",
        error: "Erreur"
    },
    ru: {
        login: "Имя пользователя",
        password: "Пароль",
        submit: "Вход",
        header: "Заголовок Сайта",
        logo: "Имя компании",
        remember: "Запомнить меня",
        error: "Ошибка"
    },
    es: {
        login: "Nombre de usuario",
        password: "Contraseña",
        submit: "Iniciar sesión",
        header: "Título del sitio web",
        logo: "nombre de empresa",
        remember: "Recuérdame",
        error: "Falta"
    },
    de: {
        login: "Benutzername",
        password: "Passwort",
        submit: "Anmelden",
        header: "Website-Titel",
        logo: "Firmenname",
        remember: "Login speichern",
        error: "Fehler"
    }
};