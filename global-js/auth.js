const accountsStorageKey = "userAccounts";
const currentUserEmailStorageKey = "currentUserEmail";

function getSavedAccounts() {
    try {
        const savedAccounts = JSON.parse(localStorage.getItem(accountsStorageKey) || "[]");
        return Array.isArray(savedAccounts) ? savedAccounts : [];
    } catch (error) {
        return [];
    }
}

function getCurrentUser() {
    const currentUserEmail = localStorage.getItem(currentUserEmailStorageKey);

    if (!currentUserEmail) return null;

    return getSavedAccounts().find((account) =>
        account.email.toLowerCase() === currentUserEmail.toLowerCase()
    ) || null;
}

function saveAccount(user) {
    const savedAccounts = getSavedAccounts();
    const accountIndex = savedAccounts.findIndex((account) =>
        account.email.toLowerCase() === user.email.toLowerCase()
    );

    if (accountIndex === -1) {
        savedAccounts.push(user);
    } else {
        savedAccounts[accountIndex] = user;
    }

    localStorage.setItem(accountsStorageKey, JSON.stringify(savedAccounts));
    localStorage.setItem(currentUserEmailStorageKey, user.email);
}

function isUserLoggedIn() {
    return Boolean(getCurrentUser());
}

function updateProfileDisplay() {
    const user = getCurrentUser();
    const profileButton = document.querySelector("#profileButton");
    const userName = document.querySelector("#user-name");
    const userEmail = document.querySelector("#user-email");
    const authButton = document.querySelector("#authButton");

    if (!profileButton || !userName || !userEmail || !authButton) return;

    if (isUserLoggedIn()) {
        userName.textContent = user.name;
        userEmail.textContent = user.email.length > 7 ? `${user.email.slice(0, 7)}...` : user.email;
        profileButton.textContent = user.profileImage ? "" : user.name.charAt(0).toUpperCase();
        profileButton.style.backgroundImage = user.profileImage ? `url("${user.profileImage}")` : "";
        profileButton.classList.toggle("has-profile-image", Boolean(user.profileImage));
        authButton.textContent = "LOGOUT";
        authButton.classList.add("logout");
    } else {
        userName.textContent = "Guest";
        userEmail.textContent = "Sign in to save your profile";
        profileButton.textContent = "?";
        profileButton.style.backgroundImage = "";
        profileButton.classList.remove("has-profile-image");
        authButton.textContent = "LOGIN";
        authButton.classList.remove("logout");
    }
}

function updateLandingButtons() {
    const startButton = document.querySelector("[data-start-practicing]");
    const authButtons = document.querySelectorAll("[data-auth-action]");

    if (!startButton) return;

    const loggedIn = isUserLoggedIn();
    startButton.hidden = !loggedIn;
    authButtons.forEach((button) => {
        button.hidden = loggedIn;
    });
}

function createAuthForm() {
    if (document.querySelector("#authPopup")) return;

    const popup = document.createElement("div");
    popup.className = "auth-popup";
    popup.id = "authPopup";
    popup.innerHTML = `
        <div class="auth-popup-card" role="dialog" aria-modal="true" aria-labelledby="authTitle">
            <div class="auth-popup-tag">CHROMATUNE // ACCOUNT</div>
            <div class="auth-popup-header">
                <h1 id="authTitle"></h1>
                <button class="auth-popup-close" type="button" aria-label="Close">×</button>
            </div>
            <form id="authForm">
                <div class="auth-popup-body">
                    <div class="profile-field profile-name-field">
                        <label for="profileName">Name</label>
                        <input id="profileName" type="text" maxlength="40" required>
                    </div>
                    <div class="profile-field">
                        <label for="profileEmail">Email</label>
                        <input id="profileEmail" type="email" required>
                    </div>
                    <div class="profile-field profile-password-field">
                        <label for="profilePassword">Password</label>
                        <input id="profilePassword" type="password" minlength="4" required>
                    </div>
                    <div class="profile-field profile-image-field">
                        <label for="profileImage">Profile image URL <span>(optional)</span></label>
                        <input id="profileImage" type="url" placeholder="https://example.com/photo.jpg">
                    </div>
                    <p class="profile-form-message" id="authMessage" aria-live="polite"></p>
                </div>
                <div class="auth-popup-footer">
                    <button class="profile-submit-button" type="submit"></button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector(".auth-popup-close").addEventListener("click", closeAuthForm);
    popup.addEventListener("click", (event) => {
        if (event.target === popup) closeAuthForm();
    });

    popup.querySelector("#authForm").addEventListener("submit", saveAuthForm);
}

function openAuthForm(mode) {
    createAuthForm();

    const popup = document.querySelector("#authPopup");
    const user = getCurrentUser();
    const title = popup.querySelector("#authTitle");
    const nameField = popup.querySelector(".profile-name-field");
    const passwordField = popup.querySelector(".profile-password-field");
    const imageField = popup.querySelector(".profile-image-field");
    const nameInput = popup.querySelector("#profileName");
    const emailInput = popup.querySelector("#profileEmail");
    const passwordInput = popup.querySelector("#profilePassword");
    const imageInput = popup.querySelector("#profileImage");
    const submitButton = popup.querySelector(".profile-submit-button");
    const message = popup.querySelector("#authMessage");

    popup.dataset.mode = mode;
    message.textContent = "";
    nameField.hidden = mode === "login";
    passwordField.hidden = mode === "edit";
    imageField.hidden = mode === "login";
    nameInput.required = mode !== "login";
    passwordInput.required = mode !== "edit";
    emailInput.disabled = mode === "edit";

    if (mode === "login") {
        title.textContent = "Welcome back";
        submitButton.textContent = "Login";
        emailInput.value = "";
        nameInput.value = "";
        passwordInput.value = "";
        imageInput.value = "";
    } else {
        const isEdit = mode === "edit";
        title.textContent = isEdit ? "Edit profile" : "Create your profile";
        submitButton.textContent = isEdit ? "Save profile" : "Register";
        nameInput.value = user?.name || "";
        emailInput.value = user?.email || "";
        passwordInput.value = "";
        imageInput.value = user?.profileImage || "";
    }

    popup.classList.add("open");
    document.body.classList.add("form-open");
    setTimeout(() => (mode === "login" ? emailInput : nameInput).focus(), 0);
}

function closeAuthForm() {
    document.querySelector("#authPopup")?.classList.remove("open");
    document.body.classList.remove("form-open");
}

function saveAuthForm(event) {
    event.preventDefault();

    const popup = document.querySelector("#authPopup");
    const mode = popup.dataset.mode;
    const name = popup.querySelector("#profileName").value.trim();
    const email = popup.querySelector("#profileEmail").value.trim();
    const password = popup.querySelector("#profilePassword").value;
    const profileImage = popup.querySelector("#profileImage").value.trim();
    const message = popup.querySelector("#authMessage");
    const savedAccounts = getSavedAccounts();
    const currentUser = getCurrentUser();

    if (mode === "login") {
        const existingUser = savedAccounts.find((account) =>
            account.email.toLowerCase() === email.toLowerCase()
        );

        if (!existingUser || existingUser.email.toLowerCase() !== email.toLowerCase()) {
            message.textContent = "Email or password is incorrect.";
            return;
        }

        if (existingUser.password && existingUser.password !== password) {
            message.textContent = "Email or password is incorrect.";
            return;
        }

        saveAccount(existingUser);
        window.location.href = "./tuner/tuner.html";
        return;
    }

    if (!name || !email) {
        message.textContent = "Please enter your name and email.";
        return;
    }

    if (mode === "register" && savedAccounts.some((account) =>
        account.email.toLowerCase() === email.toLowerCase()
    )) {
        message.textContent = "An account already exists for that email.";
        return;
    }

    saveAccount({
        name,
        email,
        profileImage,
        password: mode === "edit" ? currentUser?.password : password
    });
    updateProfileDisplay();
    closeAuthForm();

    if (mode === "register") {
        window.location.href = "./tuner/tuner.html";
    }
}

function setupAuthentication() {
    updateProfileDisplay();
    updateLandingButtons();

    document.querySelectorAll("[data-auth-action]").forEach((button) => {
        button.addEventListener("click", () => openAuthForm(button.dataset.authAction));
    });

    document.querySelector("[data-start-practicing]")?.addEventListener("click", () => {
        window.location.href = "./tuner/tuner.html";
    });

    const profileButton = document.querySelector("#profileButton");
    profileButton?.addEventListener("click", () => {
        if (isUserLoggedIn()) openAuthForm("edit");
    });

    const authButton = document.querySelector("#authButton");
    authButton?.addEventListener("click", () => {
        if (isUserLoggedIn()) {
            localStorage.removeItem(currentUserEmailStorageKey);
            window.location.href = "../index.html";
        } else {
            window.location.href = "../index.html";
        }
    });
}

setupAuthentication();
