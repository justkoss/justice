// i18n.js - Internationalization Helper (Electron Renderer Compatible)

class I18n {
  constructor() {
    // Embed translations directly - no filesystem needed
    this.translations = {
  "fr": {
    
    "app": {
      "name": "acteFlow",
      "version": "v1.0",
      "title": "Gestionnaire d'Actes"
    },
    "login": {
      "title": "Connexion",
      "subtitle": "Authentification sécurisée",
      "username": "Nom d'utilisateur",
      "password": "Mot de passe",
      "serverUrl": "URL du serveur",
      "serverUrlHelp": "Laissez par défaut si le serveur fonctionne localement",
      "usernamePlaceholder": "Entrez votre nom d'utilisateur",
      "passwordPlaceholder": "Entrez votre mot de passe",
      "signIn": "Se connecter",
      "authenticating": "Authentification...",
      "firstTimeInfo": "Première fois ? Utilisez les identifiants du serveur",
      "offlineInfo": "Mode hors ligne disponible après la première connexion",
      "errors": {
        "emptyFields": "Veuillez entrer le nom d'utilisateur et le mot de passe",
        "loginFailed": "Échec de la connexion. Veuillez vérifier vos identifiants.",
        "connectionError": "Une erreur s'est produite lors de la connexion. Veuillez réessayer."
      },
      "status": {
        "localAuth": "Authentification locale...",
        "offlineSuccess": "✓ Connexion réussie (mode hors ligne)",
        "localFailed": "Échec de l'authentification locale, tentative avec le serveur...",
        "firstLogin": "Première connexion - connexion au serveur...",
        "serverSuccess": "✓ Connexion réussie ! Identifiants sauvegardés pour une utilisation hors ligne."
      }
    },
    "header": {
      "selectFolder": "Sélectionner le Dossier",
      "logout": "Déconnexion"
    },
    "notifications": {
      "title": "Notifications",
      "empty": "Aucune notification",
      "newModification": "Nouvelle demande de modification"
    },
    "sync": {
      "syncAll": "Synchroniser tous les actes traités",
      "syncing": "Synchronisation en cours...",
      "progress": "Synchronisation de {current} sur {total}",
      "success": "✓ {count} acte(s) synchronisé(s) avec succès",
      "partial": "⚠ {success} synchronisé(s), {failed} échoué(s)",
      "noProcessed": "Aucun acte traité à synchroniser",
      "error": "✗ Erreur lors de la synchronisation"
    },
    "tabs": {
      "documents": "Actes",
      "modifications": "Demandes de modification"
    },
    "filters": {
      "all": "Tous",
      "unprocessed": "Non traités",
      "processed": "Traités"
    },
    "documentList": {
      "empty": "Aucun acte trouvé",
      "emptyHint": "Sélectionnez un dossier pour commencer",
      "noModifications": "Aucune demande de modification",
      "modificationsHint": "Les demandes apparaîtront ici"
    },
    "viewer": {
      "noSelection": "Sélectionnez un acte pour commencer",
      "noSelectionHint": "Cliquez sur un PDF de la liste pour le visualiser et le traiter"
    },
    "processing": {
      "selectNewFile": "1. Sélectionner un nouveau fichier",
      "confirmAndSend": "2. Confirmer et envoyer",
      "fileSelected": "Fichier sélectionné ✓",
      "newFileSelected": "Nouveau fichier sélectionné. Vérifiez les métadonnées ci-dessous et cliquez sur 'Confirmer et envoyer'.",
      "fillAllFields": "Veuillez remplir tous les champs",
      "mustSelectNewFile": "Veuillez d'abord sélectionner un nouveau fichier PDF",
      "title": "Traitement d'Acte",
      "currentDocument": "Acte actuel",
      "bureau": "Bureau",
      "registreType": "Type du registre",
      "year": "Année",
      "yearPlaceholder": "AAAA",
      "acteNumber": "Numéro d'acte",
      "actePlaceholder": "Entrez le numéro d'acte",
      "registreNumber": "Numéro de registre",
      "registrePlaceholder": "Entrez le numéro de registre",
      "searchPlaceholder": "Rechercher ou ajouter...",
      "selectType": "Sélectionnez un type",
      "status": {
        "unprocessed": "Non traité",
        "processed": "Traité"
      },
      "save": "Enregistrer et marquer comme traité",
      "sync": "Synchroniser au serveur",
      "requestModification": "Demander une modification",
      "viewModification": "Voir la demande",
      "reupload": "Remplacer le fichier",
      "noDocumentSelected": "Sélectionnez un acte à traiter",
      "errorType": "Type d'erreur",
      "agentMessage": "Message de l'agent",
      "metadata": "Métadonnées de l'acte",
      "saveModification": "Enregistrer les modifications"
    },
    "registreTypes": {
      "naissances": "Registre des naissances",
      "deces": "Registre des décès",
      "jugements": "Registre des jugements déclaratifs",
      "transcriptions": "Registre de transcriptions des déclarations",
      "etrangers": "Registre des étrangers"
    },
    "bureaux": {
      "ainchock": "Aïn Chock",
      "ainsebaa": "Aïn Sebaâ",
      "alfida": "Al Fida",
      "anfa": "Anfa",
      "benmsik": "Ben M'sik",
      "essoukhour": "Essoukhour Assawda",
      "hayhassani": "Hay Hassani",
      "haymohammadi": "Hay Mohammadi",
      "maarif": "Maârif",
      "merssultan": "Mers Sultan",
      "moulayrachid": "Moulay Rachid",
      "sbata": "Sbata",
      "sidibelyout": "Sidi Belyout",
      "sidibernoussi": "Sidi Bernoussi",
      "sidimoumen": "Sidi Moumen",
      "sidiothman": "Sidi Othman"
    },
    "modification": {
      "uploading": "Préparation de l'envoi...",
      "sendingToServer": "Envoi au serveur...",
      "sent": "Envoyé ✓",
      "sentSuccess": "Document envoyé avec succès et en attente de révision",
      "awaitingReview": "En attente de révision",
      "reason": "Raison de la modification",
      "reasonPlaceholder": "Décrivez la raison de la modification...",
      "submit": "Soumettre la demande",
      "requestedBy": "Demandée par",
      "requestedAt": "Demandée le",
      "status": "Statut",
      "pending": "En attente",
      "approved": "Approuvée",
      "rejected": "Rejetée"
    }
  },
  "ar": {
    "app": {
      "name": "acteFlow",
      "version": "الإصدار 1.0",
      "title": "مدير الرسوم"
    },
    "login": {
      "title": "تسجيل الدخول",
      "subtitle": "مصادقة آمنة",
      "username": "اسم المستخدم",
      "password": "كلمة المرور",
      "serverUrl": "عنوان الخادم",
      "serverUrlHelp": "اتركه افتراضياً إذا كان الخادم يعمل محلياً",
      "usernamePlaceholder": "أدخل اسم المستخدم",
      "passwordPlaceholder": "أدخل كلمة المرور",
      "signIn": "تسجيل الدخول",
      "authenticating": "جاري المصادقة...",
      "firstTimeInfo": "المرة الأولى؟ استخدم بيانات اعتماد الخادم",
      "offlineInfo": "الوضع دون اتصال متاح بعد تسجيل الدخول الأول",
      "errors": {
        "emptyFields": "الرجاء إدخال اسم المستخدم وكلمة المرور",
        "loginFailed": "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.",
        "connectionError": "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى."
      },
      "status": {
        "localAuth": "مصادقة محلية...",
        "offlineSuccess": "✓ تم تسجيل الدخول بنجاح (وضع عدم الاتصال)",
        "localFailed": "فشلت المصادقة المحلية، محاولة مع الخادم...",
        "firstLogin": "تسجيل الدخول الأول - الاتصال بالخادم...",
        "serverSuccess": "✓ تم تسجيل الدخول بنجاح! تم حفظ بيانات الاعتماد للاستخدام دون اتصال."
      }
    },
    "header": {
      "selectFolder": "اختر المجلد",
      "logout": "تسجيل الخروج"
    },
    "notifications": {
      "title": "الإشعارات",
      "empty": "لا توجد إشعارات",
      "newModification": "طلب تعديل جديد"
    },
    "sync": {
      "syncAll": "مزامنة جميع الرسوم المعالجة",
      "syncing": "جاري المزامنة...",
      "progress": "مزامنة {current} من {total}",
      "success": "✓ تمت مزامنة {count} رسم بنجاح",
      "partial": "⚠ {success} متزامن، {failed} فشل",
      "noProcessed": "لا توجد رسوم معالجة للمزامنة",
      "error": "✗ خطأ في المزامنة"
    },
    "tabs": {
      "documents": "الرسوم",
      "modifications": "طلبات التعديل"
    },
    "filters": {
      "all": "الكل",
      "unprocessed": "غير معالج",
      "processed": "معالج"
    },
    "documentList": {
      "empty": "لا توجد رسوم",
      "emptyHint": "حدد مجلداً للبدء",
      "noModifications": "لا توجد طلبات تعديل",
      "modificationsHint": "ستظهر الطلبات هنا"
    },
    "viewer": {
      "noSelection": "اختر رسماً للبدء",
      "noSelectionHint": "انقر على ملف PDF من القائمة لعرضه ومعالجته"
    },
    "processing": {
      "selectNewFile": "1. حدد ملف جديد",
      "confirmAndSend": "2. تأكيد والإرسال",
      "fileSelected": "تم تحديد الملف ✓",
      "newFileSelected": "تم تحديد ملف جديد. تحقق من البيانات الوصفية أدناه وانقر على 'تأكيد والإرسال'.",
      "fillAllFields": "يرجى ملء جميع الحقول",
      "mustSelectNewFile": "يرجى تحديد ملف PDF جديد أولاً",
      "title": "معالجة الرسم",
      "currentDocument": "الرسم الحالي",
      "bureau": "المكتب",
      "registreType": "نوع السجل",
      "year": "السنة",
      "yearPlaceholder": "سنة",
      "acteNumber": "رقم الرسم",
      "actePlaceholder": "أدخل رقم الرسم",
      "registreNumber": "رقم السجل",
      "registrePlaceholder": "أدخل رقم السجل",
      "searchPlaceholder": "بحث أو إضافة...",
      "selectType": "اختر نوعاً",
      "status": {
        "unprocessed": "غير معالج",
        "processed": "معالج"
      },
      "save": "حفظ وتعليم كمعالج",
      "sync": "مزامنة مع الخادم",
      "requestModification": "طلب تعديل",
      "viewModification": "عرض الطلب",
      "reupload": "استبدال الملف",
      "noDocumentSelected": "اختر رسماً للمعالجة",
      "errorType": "نوع الخطأ",
      "agentMessage": "رسالة الوكيل",
      "metadata": "بيانات الرسم",
      "saveModification": "حفظ التعديلات"
    },
    "registreTypes": {
      "naissances": "سجل المواليد",
      "deces": "سجل الوفيات",
      "jugements": "سجل الأحكام التصريحية",
      "transcriptions": "سجل نسخ التصريحات",
      "etrangers": "سجل الأجانب"
    },
    "bureaux": {
      "ainchock": "عين الشق",
      "ainsebaa": "عين السبع",
      "alfida": "الفداء",
      "anfa": "أنفا",
      "benmsik": "بن مسيك",
      "essoukhour": "الصخور السوداء",
      "hayhassani": "الحي الحسني",
      "haymohammadi": "الحي المحمدي",
      "maarif": "المعاريف",
      "merssultan": "مرس السلطان",
      "moulayrachid": "مولاي رشيد",
      "sbata": "سباتة",
      "sidibelyout": "سيدي بليوط",
      "sidibernoussi": "سيدي البرنوصي",
      "sidimoumen": "سيدي مومن",
      "sidiothman": "سيدي عثمان"
    },
    "modification": {
      "uploading": "جاري التحضير للإرسال...",
      "sendingToServer": "الإرسال إلى الخادم...",
      "sent": "تم الإرسال ✓",
      "sentSuccess": "تم إرسال المستند بنجاح وهو في انتظار المراجعة",
      "awaitingReview": "في انتظار المراجعة",
      "alreadySent": "تم إرسال هذا المستند بالفعل وهو في انتظار المراجعة",
      "reason": "سبب التعديل",
      "reasonPlaceholder": "صف سبب التعديل...",
      "submit": "إرسال الطلب",
      "requestedBy": "طلبت من قبل",
      "requestedAt": "طلبت في",
      "status": "الحالة",
      "pending": "قيد الانتظار",
      "approved": "موافق عليها",
      "rejected": "مرفوضة"
    }
  }
};
    
    this.currentLanguage = 'fr';
    this.loadSavedLanguage();
  }

  loadSavedLanguage() {
    try {
      const lang = localStorage.getItem('appLanguage');
      if (lang && (lang === 'fr' || lang === 'ar')) {
        this.currentLanguage = lang;
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  }

  setLanguage(lang) {
    if (lang === 'fr' || lang === 'ar') {
      this.currentLanguage = lang;
      try {
        localStorage.setItem('appLanguage', lang);
      } catch (error) {
        console.error('Error saving language:', error);
      }
      this.updateDOM();
      this.updateDirection();
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }

  updateDOM() {
    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      if (element.tagName === 'TITLE') {
        element.textContent = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update all elements with data-i18n-placeholder attribute
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    // Update all elements with data-i18n-title attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });

    // Update html lang attribute
    document.documentElement.lang = this.currentLanguage;
  }

  updateDirection() {
    const isRTL = this.currentLanguage === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', isRTL);
    
    // Use CSS order property to swap panels visually without touching DOM
    this.swapPanelsWithCSS(isRTL);
  }
  
  swapPanelsWithCSS(isRTL) {
    const sidebar = document.querySelector('.sidebar');
    const viewer = document.querySelector('.viewer-section');
    const processingPanel = document.querySelector('.processing-panel');
    
    if (!sidebar || !viewer || !processingPanel) return;
    
    if (isRTL) {
      // RTL: Processing Panel (1), Viewer (2), Sidebar (3)
      processingPanel.style.order = '1';
      viewer.style.order = '2';
      sidebar.style.order = '3';
    } else {
      // LTR: Sidebar (1), Viewer (2), Processing Panel (3)
      sidebar.style.order = '1';
      viewer.style.order = '2';
      processingPanel.style.order = '3';
    }
  }

  init() {
    this.updateDOM();
    this.updateDirection();
  }
}

// Create global instance
const i18n = new I18n();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}