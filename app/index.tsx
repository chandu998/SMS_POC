import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as SMS from 'expo-sms';
import React, { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, View as RNView, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isWhatsApp, setIsWhatsApp] = useState(false);
  const [isMMS, setIsMMS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const hiddenViewRef = useRef(null);

  const normalizePhone = (num: string): string => num.replace(/[^+\d]/g, '');
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.9 });
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImageUri(uri);
    }
  };

  const sendMessage = async () => {
    console.log('Send button pressed');
    const normalizedPhone = normalizePhone(phoneNumber);
    console.log('Normalized phone:', normalizedPhone);

    if (!normalizedPhone) {
      Alert.alert('Invalid number', 'Please enter a valid phone number.');
      return;
    }

    if (isWhatsApp || isMMS) {
      setLoading(true);
      try {
        const uri = await captureRef(hiddenViewRef, { format: 'png', quality: 0.8 });
        const imageBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const vercelApiUrl = 'https://your-vercel-project-url.vercel.app/api/send-message'; // TODO: Replace with your actual Vercel URL
        const response = await fetch(vercelApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: normalizedPhone,
            body: message,
            imageBase64,
            channel: isWhatsApp ? 'whatsapp' : 'mms',
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to send message.');
        Alert.alert('Success', `Message sent with SID: ${result.sid}`);
      } catch (error: any) {
        Alert.alert('Error', error.message ?? 'Could not send message.');
      } finally {
        setLoading(false);
      }
    } else {
      const isAvailable = await SMS.isAvailableAsync();
      console.log('SMS available:', isAvailable);
      if (!isAvailable) {
        Alert.alert('Not supported', 'SMS is not available on this device.');
        return;
      }

      try {
        // Capture the hidden view (image + description)
        const uri = await captureRef(hiddenViewRef, {
          format: 'png',
          quality: 0.8,
        });
        console.log('Captured image URI:', uri);

        const attachments = [
          {
            uri,
            mimeType: 'image/png',
            filename: 'combined.png',
          },
        ];

        setLoading(true);
        const { result } = await SMS.sendSMSAsync([normalizedPhone], '', { attachments });
        console.log('SMS send result:', result);
        if (result === 'cancelled') {
          Alert.alert('Message cancelled', 'The message was cancelled.');
        }
      } catch (e: any) {
        console.log('SMS send error:', e);
        Alert.alert('Failed to send', e?.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.title}>Send Message</Text>

          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <Text style={styles.imageHint}>Tap to pick a photo</Text>
            )}
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Type your message"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <View style={styles.radioGroup}>
            <Pressable onPress={() => { setIsWhatsApp(false); setIsMMS(false); }} style={[styles.radioButton, !isWhatsApp && !isMMS && styles.selected]}>
              <Text style={styles.radioText}>SMS</Text>
            </Pressable>
            <Pressable onPress={() => { setIsWhatsApp(true); setIsMMS(false); }} style={[styles.radioButton, isWhatsApp && styles.selected]}>
              <Text style={styles.radioText}>WhatsApp</Text>
            </Pressable>
            <Pressable onPress={() => { setIsWhatsApp(false); setIsMMS(true); }} style={[styles.radioButton, isMMS && styles.selected]}>
              <Text style={styles.radioText}>MMS</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.btn, phoneNumber && message ? {} : styles.disabled]}
            onPress={sendMessage}
            disabled={!phoneNumber || !message || loading}
          >
            <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send'}</Text>
          </Pressable>
        </ScrollView>
        <RNView
          ref={hiddenViewRef}
          style={styles.hiddenContainer}
          collapsable={false}
        >
          <View style={{ backgroundColor: 'white', padding: 10 }}>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.hiddenImage} />}
            <Text style={styles.hiddenText}>{message}</Text>
          </View>
        </RNView>
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
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  radioText: {
    color: '#fff',
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
  viewShotContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePicker: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageHint: {
    color: '#999',
  },
  messagePreview: {
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
  hiddenContainer: {
    position: 'absolute',
    top: -9999, // Position it off-screen
  },
  hiddenImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  hiddenText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 8,
    color: 'black',
  },
});