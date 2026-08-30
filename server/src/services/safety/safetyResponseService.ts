export class SafetyResponseService {
  public static getRedResponse(preferredName: string, language: string = 'en'): string {
    if (language === 'hi') {
      return `${preferredName || 'दोस्त'}, मैं सुन रहा हूँ और आपकी सुरक्षा मेरे लिए सबसे महत्वपूर्ण है। आप अकेले नहीं हैं। कृपया तुरंत एक पेशेवर या किसी भरोसेमंद व्यक्ति से बात करें। नीचे सीधे 24/7 निःशुल्क सहायता उपलब्ध है।`;
    }
    if (language === 'mr') {
      return `${preferredName || 'मित्रा'}, मी ऐकत आहे आणि तुमची सुरक्षितता खूप महत्त्वाची आहे. तुम्ही एकटे नाही आहात. कृपया खालील मोफत 24/7 हेल्पलाइनशी त्वरित संपर्क साधा.`;
    }
    return `${preferredName ? preferredName + ', ' : ''}I am here with you, and your safety is the most important thing. You do not have to carry this alone. Please connect with an immediate support professional or someone you trust right now.`;
  }

  public static getYellowNudge(preferredName: string, language: string = 'en'): string {
    if (language === 'hi') {
      return `लगता है कि पिछले कुछ दिनों से चीज़ें काफी भारी लग रही हैं। क्या आप कॉलेज काउंसलर से बिना नाम बताए बात करना चाहेंगे?`;
    }
    return `It sounds like things have been feeling quite heavy lately. Would you like me to connect you discreetly with a college counsellor or explore a calming reset?`;
  }
}
