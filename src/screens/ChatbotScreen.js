import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import your services
import Markdown from 'react-native-markdown-display';
import { getAllTravelData } from '../services/FirebaseService';
import { sendMessageToGemini } from '../services/GeminiService';
export const listAvailableModels = async () => {
  const apiKey = 'AIzaSyAkT5iDirGlGpMoN8FHGtPG5c-Tlx87Xc0'; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("--- AVAILABLE GEMINI MODELS ---");
    data.models.forEach(model => {
      console.log(`\nName: ${model.name}`);
      console.log(`Description: ${model.description}`);
      console.log(`Capabilities: ${model.supportedGenerationMethods.join(', ')}`);
      console.log(`Input Token Limit: ${model.inputTokenLimit}`);
      console.log(`Output Token Limit: ${model.outputTokenLimit}`);
    });
  } catch (error) {
    console.error("Error fetching models:", error);
  }
};

export default function ChatbotScreen() {
  const router = useRouter();
  
  // 1. STATE
  const [messages, setMessages] = useState([
    { id: '1', text: "Hello! I am your Dream Trip Assistant. How can I help you plan your travel in Malaysia today?", role: 'model' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [tripContext, setTripContext] = useState('');

  // 2. LOAD DATA ON MOUNT
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading travel data from Firebase...");
      const dataString = await getAllTravelData();
      if (dataString) {
        setTripContext(dataString);
        console.log("Travel data loaded successfully.");
      }
    };
    loadData();
  }, []);

  // 3. PREPARE HISTORY FOR API
  const getHistoryForGemini = () => {
    return messages
      .filter(msg => msg.id !== '1') 
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
  };

  // 4. HANDLE SEND
  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add User Message
    const userMessage = { id: Date.now().toString(), text: inputText, role: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText; // Store for API call
    setInputText('');
    setLoading(true);

    try {
      const history = getHistoryForGemini();
      const responseText = await sendMessageToGemini(currentInput, history, tripContext);

      // Add Bot Message
      const botMessage = { id: (Date.now() + 1).toString(), text: responseText, role: 'model' };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error(error);
      const errorMessage = { id: (Date.now() + 1).toString(), text: "Sorry, I'm having trouble connecting right now.", role: 'model' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 5. RENDER BUBBLES
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const messageContent = String(item.text || ''); // Safety check

    return (
      <View style={[
        styles.messageBubble, 
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Markdown 
          style={isUser ? markdownStylesUser : markdownStylesBot}
          // mergeStyle={true} // Optional: ensures styles merge correctly
        >
          {messageContent}
        </Markdown>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Assistant</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Keyboard Handling */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        // iOS needs "padding". Android usually behaves better with "height" OR undefined if using "pan" in app.json
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about food, places, or plans..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline={true} 
            textAlignVertical="center" // Android fix for multiline centering
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.disabledButton]} 
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backButton: { padding: 5 },
  listContent: { padding: 15, paddingBottom: 20 },
  
  messageBubble: {
    maxWidth: '85%', // Slightly wider for tables
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#648DDB',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#648DDB',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  }
});

// --- MARKDOWN STYLES ---

// Styles for the BOT
const markdownStylesBot = {
  // 1. Remove outer margins from the body
  body: { 
    fontSize: 15, 
    color: '#333',
    padding: 0,
    marginTop: 0,
    marginBottom: 0, 
  },
  // 2. CRITICAL: Remove margins from paragraphs to fix the "hi" bubble height
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
    flexWrap: 'wrap', // Ensures text wraps correctly
  },
  // Table styles (keep these)
  table: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginTop: 5 },
  tr: { borderBottomWidth: 1, borderColor: '#ccc', flexDirection: 'row' },
  th: { backgroundColor: '#f0f0f0', padding: 8, fontWeight: 'bold' },
  td: { padding: 8, borderColor: '#ccc', borderRightWidth: 1 },
};

// Styles for the USER
const markdownStylesUser = {
  body: { 
    fontSize: 15, 
    color: '#FFF',
    padding: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
    flexWrap: 'wrap',
  },
  table: { borderWidth: 1, borderColor: '#FFF', marginTop: 5 },
  tr: { borderBottomWidth: 1, borderColor: '#FFF', flexDirection: 'row' },
  th: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, color: '#FFF', fontWeight: 'bold' },
  td: { padding: 8, borderColor: '#FFF', color: '#FFF' },
};