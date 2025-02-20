import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, Download, X, Upload, RefreshCw, Github, Globe } from 'lucide-react';
import Dropzone from 'react-dropzone';

type Mode = 'encode' | 'decode';

// Steganography utility functions
const steganography = {
  encode: async (image: File, message: string): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Convert message to binary
          const binary = message.split('').map(char => 
            char.charCodeAt(0).toString(2).padStart(8, '0')
          ).join('');

          // Embed message length at the beginning
          const lengthBinary = message.length.toString(2).padStart(16, '0');
          const totalBinary = lengthBinary + binary;

          // Embed data in least significant bits
          for (let i = 0; i < totalBinary.length; i++) {
            const bit = parseInt(totalBinary[i]);
            pixels[i * 4] = (pixels[i * 4] & 254) | bit;
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL());
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(image);
    });
  },

  decode: async (image: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Extract message length (first 16 bits)
          let lengthBinary = '';
          for (let i = 0; i < 16; i++) {
            lengthBinary += pixels[i * 4] & 1;
          }
          const messageLength = parseInt(lengthBinary, 2);

          // Extract message bits
          let messageBinary = '';
          for (let i = 16; i < 16 + messageLength * 8; i++) {
            messageBinary += pixels[i * 4] & 1;
          }

          // Convert binary to text
          const message = messageBinary.match(/.{8}/g)?.map(byte => 
            String.fromCharCode(parseInt(byte, 2))
          ).join('') || '';

          resolve(message);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(image);
    });
  }
};

function Preloader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center"
    >
      <div className="relative">
        <motion.div
          animate={{
            rotate: 360,
            transition: { duration: 2, repeat: Infinity, ease: "linear" }
          }}
          className="w-20 h-20 border-4 border-cyan-500 rounded-full border-t-transparent"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            transition: { duration: 1.5, repeat: Infinity }
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Shield className="w-8 h-8 text-cyan-400" />
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute mt-24 text-cyan-400 font-semibold"
      >
        Securing your data...
      </motion.p>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Shield className="w-6 h-6 text-cyan-400 mr-2" />
            <span className="text-white font-semibold">STEGNO</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              <Globe className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>Secure your messages with advanced steganography techniques.</p>
          <p className="mt-2">© {new Date().getFullYear()} STEGNO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('encode');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [showProcessPopup, setShowProcessPopup] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleImageDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedImage(acceptedFiles[0]);
      setShowProcessPopup(true);
      
      if (mode === 'decode') {
        setIsProcessing(true);
        try {
          const message = await steganography.decode(acceptedFiles[0]);
          setDecodedMessage(message);
          setShowProcessPopup(false);
          setShowResultPopup(true);
        } catch (error) {
          console.error('Error decoding message:', error);
          setDecodedMessage('Failed to decode message. Please try another image.');
        }
        setIsProcessing(false);
      }
    }
  };

  const handleEncode = async () => {
    if (selectedImage && message) {
      setIsProcessing(true);
      try {
        const encodedImageUrl = await steganography.encode(selectedImage, message);
        setResultImage(encodedImageUrl);
        setShowProcessPopup(false);
        setShowResultPopup(true);
      } catch (error) {
        console.error('Error encoding message:', error);
        alert('Failed to encode message. Please try again.');
      }
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    setMessage('');
    setResultImage(null);
    setDecodedMessage(null);
    setShowProcessPopup(false);
    setShowResultPopup(false);
  };

  return (
    <>
      <AnimatePresence>
        {loading && <Preloader />}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
        <header className="p-6 flex items-center justify-center">
          <Shield className="w-10 h-10 text-cyan-400 mr-3" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            STEGNO
          </h1>
        </header>

        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                mode === 'encode'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => {
                setMode('encode');
                resetState();
              }}
            >
              <Lock className="w-5 h-5" />
              <span className="hidden sm:inline">Encode</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                mode === 'decode'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => {
                setMode('decode');
                resetState();
              }}
            >
              <Unlock className="w-5 h-5" />
              <span className="hidden sm:inline">Decode</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-lg flex items-center gap-2 bg-gray-700 text-gray-300 hover:bg-gray-600"
              onClick={resetState}
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline">Reset</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Dropzone onDrop={handleImageDrop}>
              {({ getRootProps, getInputProps }) => (
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-500 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-300">
                      Drag & drop an image here, or click to select
                    </p>
                  </div>
                </div>
              )}
            </Dropzone>
          </motion.div>

          <AnimatePresence>
            {showProcessPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              >
                <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
                  <button
                    onClick={() => setShowProcessPopup(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-xl font-bold mb-4">
                    {mode === 'encode' ? 'Encode Message' : 'Decode Image'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <img
                        src={selectedImage ? URL.createObjectURL(selectedImage) : ''}
                        alt="Selected"
                        className="max-h-48 rounded"
                      />
                    </div>
                    {mode === 'encode' && (
                      <>
                        <textarea
                          className="w-full bg-gray-700 rounded-lg p-4 text-white"
                          placeholder="Enter your secret message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full px-6 py-3 bg-cyan-500 rounded-lg flex items-center justify-center gap-2"
                          onClick={handleEncode}
                          disabled={!selectedImage || !message || isProcessing}
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                          {isProcessing ? 'Processing...' : 'Encode Message'}
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {showResultPopup && (mode === 'encode' ? resultImage : decodedMessage) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              >
                <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
                  <button
                    onClick={() => {
                      setShowResultPopup(false);
                      resetState();
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-xl font-bold mb-4">
                    {mode === 'encode' ? 'Encoded Image' : 'Decoded Message'}
                  </h3>
                  {mode === 'encode' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <img
                          src={resultImage}
                          alt="Result"
                          className="max-h-48 rounded mb-4"
                        />
                      </div>
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={resultImage!}
                        download="stegno-image.png"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 rounded-lg"
                      >
                        <Download className="w-5 h-5" />
                        Download Image
                      </motion.a>
                    </div>
                  ) : (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-cyan-400 font-mono">
                        {decodedMessage}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default App;