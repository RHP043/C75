import React from 'react';
import {Text,View, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, ToastAndroid, Alert} from  'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner'
import { TextInput } from 'react-native-gesture-handler';
import * as firebase from 'firebase';
import db from '../config.js'

export default class TransactionScreen extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedBookId:'',
            scannedStudentId: '',
            buttonState: 'normal',
            transactionMessage: '',
        }
    }

    getCameraPermissions = async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            //status is === "granted" isTrue when the user has granted permission and is false when the user hasnt granted permissions
            hasCameraPermissions:status === "granted",
            buttonState: id,
            scanned: false    
        })
    }

        handleBarcodeScanned = async({type,data})=>{
           const {buttonState}=this.state
           if(buttonState === "BookId"){
               this.setState({
                   scanned:true,
                   scannedBookId: data,
                   buttonState: 'normal'
               })
           }

           else if(buttonState === "StudentId"){
            this.setState({
                scanned:true,
                scannedStudentId: data,
                buttonState: 'normal'
            })
        }
        }

        initiateBookIssue = async()=>{
            db.collection("Transaction").add({
                'studentId': this.state.scannedStudentId,
                'bookId': this.state.scannedBookId,
                'date': firebase.firestore.Timestamp.now().toDate(),
                'transactionType': "issue"
            })
            db.collection("Books").doc(this.state.scannedBookId).update({
                'bookAvailability': false
            })

            db.collection("Students").doc(this.state.scannedStudentId).update({
                'numberOfBooksIssued': firebase.firestore.FieldValue.increment(1)
            })
            this.setState({
                scannedStudentId: '',
                scannedBookId: ''
            })
            
        }

        initiateBookReturn = async()=>{
            db.collection("Transaction").add({
                'studentId': this.state.scannedStudentId,
                'bookId': this.state.scannedBookId,
                'date': firebase.firestore.Timestamp.now().toDate(),
                'transactionType': "return"
            })
            db.collection("Books").doc(this.state.scannedBookId).update({
                'bookAvailability': true
            })

            db.collection("Students").doc(this.state.scannedStudentId).update({
                'numberOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
            })
            this.setState({
                scannedStudentId: '',
                scannedBookId: ''
            })
            
        }


        checkBookEligibility = async()=>{
            const bookRef = await db.collection("Books").where("bookId","==",this.state.scannedBookId).get()
            var transactionType = ""
            if(bookRef.docs.length === 0){
                transactionType = false;
            }
            else{
                bookRef.docs.map((doc)=>{
                    var book = doc.data()
                    if(book.bookAvailability){
                        transactionType = "issue"
                    }
                    else {
                        transactionType = "return"
                    }
                })
            }
            return transactionType;
        }

        checkStudentEligibilityForBookIssue = async()=>{
            const studentRef = await db.collection("Students").where("studentId","==",this.state.scannedStudentId).get()
            var isStudentEligible = ""
            if(studentRef.docs.length === 0){
                this.setState({
                    scannedStudentId: '',
                    scannedBookId: ''
                })
                isStudentEligible = false
                Alert.alert("studentId doesnt exist in database")
            }
            else{
                studentRef.docs.map((doc)=>{
                    var student = doc.data()
                   if(student.numberOfBooksIssued < 2) {
                       isStudentEligible = true;
                   }
                   else {
                       isStudentEligible = false;
                       alert("Student has already issued 2 books")
                       this.setState({
                        scannedStudentId: '',
                        scannedBookId: ''
                    })
                   }
                })
            }
            return isStudentEligible;
        }
        checkStudentEligibilityForBookReturn = async()=>{
            const transactionRef = await db.collection("Transaction").where("bookId","==",this.state.scannedBookId).limit(1).get()
            var isStudentEligible = ""
            
                transactionRef.docs.map((doc)=>{
                    var lastBookTransaction = doc.data();
                    if(lastBookTransaction.studentId === this.state.scannedStudentId){
                        isStudentEligible = true
                    } else{
                        isStudentEligible = false
                        alert("the book was not issued by this student")
                        this.setState({
                            scannedStudentId: '',
                            scannedBookId: '',
                        })
                    }
                })
            return isStudentEligible;
        }
       handleTransaction = async() => {
            var transactionType = await this.checkBookEligibility();
            if(!transactionType) {
                alert("The book doesnt exist in our library database!")
                this.setState({
                    scannedStudentId:'',
                    scannedBookId:''
                })
            }
            else if(transactionType === "issue") {
                var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
                if(isStudentEligible) {
                    this.initiateBookIssue()
                    alert("book issued to the student")
                }
            }
            else {
                var isStudentEligible = await this.checkStudentEligibilityForBookReturn();
                if(isStudentEligible) {
                    this.initiateBookReturn()
                    Alert.alert("book returned to the library")
                }
            }

        }

    render() {
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState = this.state.buttonState;
        if(buttonState !=="normal" && hasCameraPermissions){
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned?undefined:this.handleBarcodeScanned}
                style = {StyleSheet.absoluteFillObject}/>     )
        }
        else if(buttonState === "normal") {
            return(
                <KeyboardAvoidingView style = {styles.container} behaviour = "padding" enabled>
                    <View>
                        <Image
                        source = {require("../assets/booklogo.jpg")}
                        style = {{width: 200, height: 200}}/>
                        <Text style = {{textAlign: 'center',fontSize: 30}}>Wily</Text>
                    </View>
                    <View style = {styles.inputView}>
                        <TextInput
                        style = {styles.inputBox}
                        placeholder = "book id"
                        onChangeText = {text => this.setState({scannedBookId:text})}
                        value = {this.state.scannedBookId}/>
                        <TouchableOpacity style = {styles.scanButton}
                        onPress = {()=>{
                            this.getCameraPermissions("BookId");
                        }}>
                            <Text style = {styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                    <View style = {styles.inputView}>
                        <TextInput
                        style = {styles.inputBox}
                        placeholder = "student id"
                        onChangeText = {text => this.setState({scannedStudentId:text})}
                        value = {this.state.scannedStudentId}/>
                        <TouchableOpacity style = {styles.scanButton}
                        onPress = {()=>{
                            this.getCameraPermissions("StudentId")
                        }}>
                            <Text style = {styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                        <TouchableOpacity
                        style = {styles.submitButton}
                            onPress = {async()=>{
                                var transactionMessage = this.handleTransaction();
                                // this.setState(
                                //      {
                                //          scannedBookId: '',
                                //          scannedStudentId: ''
                                //      }
                                // )
                            }}>
                            <Text style = {styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                        </KeyboardAvoidingView>
            )
        }
    }

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    displayText: {
        fontSize: 15,
        textDecorationLine: 'underline',
    },

    scanButton:{
        backgroundColor:'#2196F3',
        padding:10,
        margin:10,
    },
    buttonText:{
        fontSize:20,
        textAlign: 'center',
        marginTop: 10
    },
    inputView:{
        flexDirection: 'row',
        margin:20
    },
    inputBox: {
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize: 20
    },
    scanButton: {
        backgroundColor: '#66BB6A',
        width: 50,
        borderWidth: 1.5,
        borderLeftWidth: 0,
    },
    submitButton: {
        backgroundColor: '#FBC020',
        width: 100,
        height: 50,
    },
    submitButtonText: {
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: "bold",
        color: 'white'
    },
})