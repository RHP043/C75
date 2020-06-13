import React from 'react';
import {Text,View,FlatList,StyleSheet,TextInput,TouchableOpacity} from  'react-native';
import db from '../config.js';
import { ScrollView } from 'react-native-gesture-handler';

export default class SearchScreen extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            allTransactions:[], 
            lastVisibleTransaction:null,
            search:'',
        }
    }
    fetchMoreTransactions = async()=>{
        var text  = this.state.search.toUpperCase()
        var enterText = text.split("");

        if(enterText[0].toUpperCase()==='B'){
            const query = await db.collection("transactions").where('bookId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get();
            query.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
        if(enterText[0].toUpperCase()==='S'){
            const query = await db.collection("transactions").where('bookId','==',text).startAfter(this.state.lastVisibleTransaction).limit(10).get();
            query.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
    }
    searchTransactions = async(text)=>{
        var enterText = text.split("");

        if(enterText[0].toUpperCase()==='B'){
            const transaction = await db.collection("transactions").where('bookId','==',text).get();
            transaction.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
        if(enterText[0].toUpperCase()==='S'){
            const transaction = await db.collection("transactions").where('studentId','==',text).get();
            transaction.docs.map((doc)=>{
                this.setState({
                    allTransactions:[...this.state.allTransactions,doc.data()],
                    lastVisibleTransaction:doc
                })
            })
        }
    }
    componentDidMount = async()=>{
        const query = await db.collection("Transaction").limit(10).get();
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions,doc.data()],
                lastVisibleTransaction:doc
            })
        })
    }
    render() {
        return(
            <View style = {styles.container}>
                <View style = {styles.searchBar}>
                    <TextInput
                    style = {styles.bar}
                    placeHolder = "Book Id or Student Id"
                    onChangeText = {(text)=>{this.setState({search:text})}}/>
                <TouchableOpacity 
                style = {styles.searchButton}
                onPress = {()=>{this.searchTransactions(this.state.search)}}>
                    <Text>Search</Text>
                </TouchableOpacity>
                </View>
                <FlatList
                data = {this.state.allTransactions}
                renderItem = {({item})=>(
                    <View style = {{borderBottomWidth:2}}>
                            <Text>{"book Id: "+ item.bookId}</Text>
                            <Text>{"student Id: "+ item.studentId}</Text>
                            <Text>{"transaction type: "+ item.transactionType}</Text>
                    </View>            
                )}
                keyExtractor = {(item,index)=>index.toString()}
                onEndReached = {this.fetchModeTransactions}
                onEndReachedThreshold  = {0.7}
                 />
            </View>
            
            )
    }

}
const styles = StyleSheet.create({
    container:{
        flex:1,
        marginTop:20
    },
    searchBar:{
        flexDirection:'row',
        height:40,
        width:'auto',
        borderWidth:0.5,
        alignItems: 'center',
        backgroundColor:'gray',
    },
    bar: {
        borderWidth:2,
        height: 30,
        width: 300,
        paddingLeft:10,
    },
    searchButton: {
        borderWidth: 1,
        height:30,
        width: 50,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'green'
    }
})