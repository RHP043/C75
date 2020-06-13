import * as firebase from 'firebase'
require('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyAyguSONAej_0q7Kiu-_JaS064libGX0NE",
    authDomain: "wily-app-91fdf.firebaseapp.com",
    databaseURL: "https://wily-app-91fdf.firebaseio.com",
    projectId: "wily-app-91fdf",
    storageBucket: "wily-app-91fdf.appspot.com",
    messagingSenderId: "919750574864",
    appId: "1:919750574864:web:af168ea7adf152cc5b1b95"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore();