import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// IMPORTANT: These are example values the user will replace in Vercel
const serviceAccount = {
    projectId: "clinicflow-x",
    clientEmail: "firebase-adminsdk-fbsvc@clinicflow-x.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC8dMoSK7TxjiUR\nsOmHwXSA93/wpv1l8+9ZSJY18L7c8mVoRMjSsFeXXOlqguy0g6+shj8GOKghTYie\n8GQZKAuOCi9iTcvc5pwf2vSm27fbRyan47G+zSPk59IhJ8PUb9gh4slrOSKaEGqy\nMs+a7op9nGcBJ7x1nrNtwI5wa/hpw1J1E3RcVaC50EoSq0YczAAC4q2B+KY2bD7c\ny7O/iHziHJP9x0tDXSuBn72pwtlsbAkOtTvd+IvWTGGH3egJ6jkLz3jX1EvDuh/Z\nDvMubp3egRfC6yjrHIBiDAmLFgWZmiWBkl8ebktYmaPWCGEny0/7p+4fbyr52DkM\n3GLdC7dlAgMBAAECggEAC3wa6B5pmEf3RTD7cQvD18Ey4ZMCVyaAHrg6+T4QRPhG\nYE3tfCja1FgJRzWuiwtfFxvroYDYlDD8rgz3LgZKpU/Ea/tS53CBXA/0qr+HS0ch\nLrLvB9z0vp7hvNCxe+k1/3ip7uLMPkiDrBOceHQS6g1Fmg8rynI5u+rzyJuih6q7\nZfwG4NHHcxoz68XCtIATmAumcjSMnewn663nLueVCZnKsrKNJ0JZhtgKe8fEamu8\nMaKpfk8GlIgfov4tiR0EN3qZcuQu1WH+dYHIylbsI8GLfgSRvY99MMPIev0XS8Lg\naewAnxcragHoBdKKEMPbgtgThjvHj+tfDdeJzrALOQKBgQDiitxfq71JWaz33DB/\nH7bqR3V4h0u5oMlSd2PlDzgxodJ4vNbAFyqRUxDp2hRAtRxf7SAeL1ooELsXjLtg\nGTGHGGNTgl0fkYYLtj10Wn+Z+p22QpEEDDVbhEMWZ/LPDEeaWx2sI1EIyut07DQX\n0wawSNw42b0t7AinNx3fXXiTKQKBgQDU9h2JPVUXVW9CVu7vHkcJmWWECsJHr1PO\nHYKWawoQFo6TUdLyDPHRm8J5bISQD8AtK2uE5EBFC0QNKTo+yVMrljnOpz14ck/d\nR3jKyp19aFbTbN+L31TfnTa6SWeOCIBbUHolB/U2+7GhxEp1FFrjVGgWcg7WCxBx\ngAd9YOnl3QKBgGKpUzyfUPqnAXuY+84Bg+oYYQKy+bnIWqV9tZXGwRRsg3tt0qEp\n9bIA2TbfcT6VIdxtKzW6LauRTcn90oURs85AQtHVzrS27ggfwDfySexHh3QfHYUD\nxCEtQwJ5FvgxQuXolM2pO9t2dIEhdbaCg0E3GiHwQkHDsCkTCgGDdcWxAoGAU/Gj\nmNpFNUpm7cZornbH15/QpSi8hhc1OJTnSbVtpQPPNYDWXrT9iPsVwFknM8YRoXxx\nCFQUhWK4c1uh6ufe0dqIdM31bAnbM0Ud9wnA5JMBTpumznK8+Nv2m52dpR3ywovJ\nadlmLkMuNK60Dsx0OxGladuRv4ti8updiW1vJT0CgYBSUZRVyEegtd27ZejRoWtR\n4jGz9IvG9+ni7Rwu+qjVJedqIpEx2c9x9UidUjaPch49wuG7t1AL1yZ0eT1BlYpq\nuXZ4tG8SjVp10nVvxL2cqIf9qyDs9gQsWhZ5Vd74UmvdUzeGdbjMdjNjo0d3fSix\nQecXG8q293yAWpTHZqymDA==\n-----END PRIVATE KEY-----\n",
};

// Initialize once
if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

export const db = getFirestore();
