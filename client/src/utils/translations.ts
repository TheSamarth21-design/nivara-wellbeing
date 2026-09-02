export type Language = 'en' | 'hi' | 'mr';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_talk: 'Talk',
    nav_twin: 'My Twin',
    nav_simulator: 'Simulator',
    nav_radar: 'Campus',
    nav_me: 'Me',

    // Top Bar
    student_badge: 'Student',
    teacher_badge: 'Teacher',
    counselor_badge: 'Counselor',
    helplines_btn: 'Helplines',
    active_wellbeing_id: 'Active Wellbeing ID',
    copied: 'Copied!',
    copy: 'Copy',
    identity_protected_note: '🔒 Identity Separated: Your personal data is protected with Firebase RBAC.',
    select_language: 'Language',
    two_minute_reset: '2-Minute Reset',
    box_breathing_desc: 'Guided box breathing exercise',
    privacy_center: 'Privacy & Consent Center',
    privacy_desc: 'Manage consents & data rights',
    crisis_helplines: '24/7 Crisis Helplines',
    tele_manas_desc: 'Tele-MANAS & Kiran Toll-Free Support',
    sign_out: 'Sign Out',
    edit_name: 'Edit Name',
    save_name: 'Save',

    // Greetings
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    greeting_sub: "You don't have to figure everything out right now.",

    // Checkin
    checkin_title: 'How are things feeling today?',
    mood_good: 'Good',
    mood_okay: 'Okay',
    mood_not_great: 'Not great',
    mood_difficult: 'Difficult',

    // Routine & Exam banner
    routine_question: 'Has anything changed in your routine or exams?',
    routine_sub: 'Update your context to keep your Twin baseline calibrated.',
    update_btn: 'Update',
    not_now_btn: 'Not now',

    // Action Cards
    talk_title: 'Talk privately with Companion',
    talk_desc: "What's on your mind? Share thoughts in a quiet, non-judgmental space via text or voice.",
    start_talking: 'Start talking',
    what_if_btn: 'What-If Simulator',

    reset_title: '2-minute reset',
    reset_desc: 'A gentle box-breathing rhythm to decompress your mind.',
    start_reset: 'Start Reset',

    campus_pulse_title: 'Campus Pulse',
    campus_pulse_desc: 'See how student cohorts are feeling across departments.'
  },
  hi: {
    // Nav
    nav_home: 'होम',
    nav_talk: 'बातचीत',
    nav_twin: 'मेरा ट्विन',
    nav_simulator: 'सिम्युलेटर',
    nav_radar: 'कैंपस',
    nav_me: 'प्रोफाइल',

    // Top Bar
    student_badge: 'विद्यार्थी',
    teacher_badge: 'शिक्षक',
    counselor_badge: 'परामर्शदाता',
    helplines_btn: 'हेल्पलाइन',
    active_wellbeing_id: 'सक्रिय वेलबीइंग आईडी',
    copied: 'कॉपी हो गया!',
    copy: 'कॉपी',
    identity_protected_note: '🔒 पहचान सुरक्षित: आपका व्यक्तिगत डेटा पूर्णतः गोपनीय रखा जाता है।',
    select_language: 'भाषा चुनें',
    two_minute_reset: '2-मिनट का रीसेट',
    box_breathing_desc: 'मन को शांत करने का श्वास व्यायाम',
    privacy_center: 'गोपनीयता और सहमति केंद्र',
    privacy_desc: 'सहमति और डेटा अधिकार प्रबंधित करें',
    crisis_helplines: '24/7 आपातकालीन हेल्पलाइन',
    tele_manas_desc: 'टेली-मानस व किरण निःशुल्क सेवा',
    sign_out: 'साइन आउट',
    edit_name: 'नाम बदलें',
    save_name: 'सहेजें',

    // Greetings
    good_morning: 'शुभ प्रभात',
    good_afternoon: 'शुभ दोपहर',
    good_evening: 'शुभ संध्या',
    greeting_sub: 'आपको अभी सब कुछ अकेले सुलझाने की ज़रूरत नहीं है।',

    // Checkin
    checkin_title: 'आज आपका मन कैसा महसूस कर रहा है?',
    mood_good: 'अच्छा',
    mood_okay: 'ठीक-ठाक',
    mood_not_great: 'कुछ खास नहीं',
    mood_difficult: 'कठिन',

    // Routine & Exam banner
    routine_question: 'क्या आपकी दिनचर्या या परीक्षाओं में कोई बदलाव हुआ है?',
    routine_sub: 'अपने ट्विन की सटीकता बनाए रखने के लिए अपनी स्थिति अपडेट करें।',
    update_btn: 'अपडेट करें',
    not_now_btn: 'अभी नहीं',

    // Action Cards
    talk_title: 'साथी से निजी तौर पर बात करें',
    talk_desc: 'आपके मन में क्या चल रहा है? बिना किसी झिझक के टेक्स्ट या आवाज़ में साझा करें।',
    start_talking: 'बात शुरू करें',
    what_if_btn: 'व्हाट-इफ सिम्युलेटर',

    reset_title: '2-मिनट का रीसेट',
    reset_desc: 'अपने तनाव को कम करने के लिए सरल बॉक्स-ब्रीदिंग तकनीक।',
    start_reset: 'रीसेट शुरू करें',

    campus_pulse_title: 'कैंपस पल्स',
    campus_pulse_desc: 'देखें विभिन्न विभागों में विद्यार्थी कैसा महसूस कर रहे हैं।'
  },
  mr: {
    // Nav
    nav_home: 'मुख्य',
    nav_talk: 'संवाद',
    nav_twin: 'माझा ट्विन',
    nav_simulator: 'सिम्युलेटर',
    nav_radar: 'कॅम्पस',
    nav_me: 'माझे खाते',

    // Top Bar
    student_badge: 'विद्यार्थी',
    teacher_badge: 'प्राध्यापक',
    counselor_badge: 'समुपदेशक',
    helplines_btn: 'हेल्पलाइन',
    active_wellbeing_id: 'सक्रिय वेलबीइंग आयडी',
    copied: 'कॉपी झाले!',
    copy: 'कॉपी',
    identity_protected_note: '🔒 ओळख सुरक्षित: तुमचा वैयक्तिक डेटा सुरक्षित व गोपनीय ठेवला जातो.',
    select_language: 'भाषा निवडा',
    two_minute_reset: '२-मिनिटांचा रीसेट',
    box_breathing_desc: 'शांततेसाठी बॉक्स-ब्रीदिंग श्वासोच्छ्वास',
    privacy_center: 'गोपनीयता व संमती केंद्र',
    privacy_desc: 'संमती आणि डेटा अधिकार व्यवस्थापित करा',
    crisis_helplines: '२४/७ संकटकालीन हेल्पलाइन',
    tele_manas_desc: 'टेली-मानस आणि किरण टोल-फ्री मदत',
    sign_out: 'बाहेर पडा',
    edit_name: 'नाव बदला',
    save_name: 'जतन करा',

    // Greetings
    good_morning: 'शुभ सकाळ',
    good_afternoon: 'शुभ दुपार',
    good_evening: 'शुभ संध्याकाळ',
    greeting_sub: 'तुम्हाला आत्ताच सर्व चिंता सोडवण्याची गरज नाही.',

    // Checkin
    checkin_title: 'आज तुम्हाला कसे वाटत आहे?',
    mood_good: 'छान',
    mood_okay: 'ठीक',
    mood_not_great: 'फारसे बरे नाही',
    mood_difficult: 'कठीण',

    // Routine & Exam banner
    routine_question: 'तुमच्या वेळापत्रकात किंवा परीक्षेत काही बदल झाला आहे का?',
    routine_sub: 'ट्विनचे अचूक विश्लेषण चालू ठेवण्यासाठी माहिती अद्ययावत करा.',
    update_btn: 'अद्ययावत करा',
    not_now_btn: 'आता नको',

    // Action Cards
    talk_title: 'सोबत्याशी खाजगीत बोला',
    talk_desc: 'मनात काय विचार आहेत? कोणत्याही संकोचाशिवाय शांतपणे सांगा.',
    start_talking: 'संवाद साधा',
    what_if_btn: 'व्हॉट-इफ सिम्युलेटर',

    reset_title: '२-मिनिटांचा रीसेट',
    reset_desc: 'ताण दूर करण्यासाठी सोपे बॉक्स-ब्रीदिंग तंत्र.',
    start_reset: 'रीसेट सुरू करा',

    campus_pulse_title: 'कॅम्पस स्पंदन',
    campus_pulse_desc: 'विविध विभागांतील विद्यार्थ्यांचे मनःस्वास्थ्य समजून घ्या.'
  }
};
