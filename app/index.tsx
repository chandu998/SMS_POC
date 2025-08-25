import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  // In the sandbox, we can't send a custom message body.
  // Instead, we'll use a variable for the template.
  const [templateVariable, setTemplateVariable] = useState('');
  const [loading, setLoading] = useState(false);
  const hiddenViewRef = useRef(null);
  
  // NOTE: You don't need the image picker or hidden view for the template message.
  // I've commented them out for clarity, but you can keep them if you plan to use them later.
  
  // const [imageUri, setImageUri] = useState<string | null>(null);
  // const normalizePhone = (num: string): string => num.replace(/[^+\d]/g, '');
  // const pickImage = async () => {
  //   const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.9 });
  //   if (!res.canceled) {
  //     const uri = res.assets[0].uri;
  //     setImageUri(uri);
  //   }
  // };

  const sendMessage = async () => {
    console.log('Send button pressed');
    const normalizedPhone = phoneNumber.replace(/[^+\d]/g, ''); // Simplified normalization

    if (!normalizedPhone || !templateVariable) {
      Alert.alert('Invalid input', 'Please enter a valid phone number and a template variable.');
      return;
    }

    setLoading(true);
    try {
      const vercelApiUrl = 'https://sms-poc-inky.vercel.app/api/send-message'; // TODO: Replace with your actual Vercel URL
      
      const response = await fetch(vercelApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizedPhone,
          // You must use contentSid and contentVariables for sandbox testing
          contentSid: 'AC2bebd399cc3004c282a942ee8483c7e9', // Replace with your template's content SID
          contentVariables: JSON.stringify({ '1': templateVariable }), // The sandbox template expects a variable named '1'
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message.');
      }
      Alert.alert('Success', `Message sent with SID: ${result.sid}`);
      setTemplateVariable(''); // Clear input on success
      setPhoneNumber('');
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Could not send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.title}>Send WhatsApp Message (Sandbox)</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter template variable (e.g., '12345')"
            value={templateVariable}
            onChangeText={setTemplateVariable}
          />
          
          <Pressable
            style={[styles.btn, (phoneNumber && templateVariable) ? {} : styles.disabled]}
            onPress={sendMessage}
            disabled={!phoneNumber || !templateVariable || loading}
          >
            <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
});