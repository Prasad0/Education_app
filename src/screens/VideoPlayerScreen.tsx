import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  PanResponder,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constants
const CONTROLS_AUTO_HIDE_DELAY = 3000;
const DOUBLE_TAP_DELAY = 300;
const GESTURE_THRESHOLD = 50;
const PROGRESS_UPDATE_INTERVAL = 1000;

interface VideoPlayerScreenProps {
  videoUrl: string;
  courseTitle: string;
  instructorName: string;
  courseDescription: string;
  onBack: () => void;
}

const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({
  videoUrl,
  courseTitle,
  instructorName,
  courseDescription,
  onBack,
}) => {
  // Refs
  const videoRef = useRef<Video>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(true); // Start in fullscreen
  const [error, setError] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>(
    ScreenOrientation.Orientation.PORTRAIT_UP
  );

  const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Helper Functions
  const formatTime = useCallback((millis: number): string => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const validateVideoUrl = useCallback((url: string): boolean => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  }, []);

  const startControlsTimeout = useCallback(() => {
    clearControlsTimeout();
    controlsTimeoutRef.current = setTimeout(() => {
      hideControls();
    }, CONTROLS_AUTO_HIDE_DELAY);
  }, []);

  // Orientation Management
  const lockOrientation = useCallback(async (orientationLock: ScreenOrientation.OrientationLock) => {
    try {
      await ScreenOrientation.lockAsync(orientationLock);
    } catch (error) {
      console.error('Error locking orientation:', error);
    }
  }, []);

  const unlockOrientation = useCallback(async () => {
    try {
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.error('Error unlocking orientation:', error);
    }
  }, []);

  const handleOrientationChange = useCallback((orientationInfo: ScreenOrientation.OrientationChangeEvent) => {
    const newOrientation = orientationInfo.orientationInfo.orientation;
    setOrientation(newOrientation);
    
    // Auto fullscreen in landscape
    if (newOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || 
        newOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, []);

  // Controls Management
  const showControlsAnimated = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    startControlsTimeout();
  }, [controlsOpacity, startControlsTimeout]);

  const hideControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  }, [controlsOpacity]);

  const toggleControls = useCallback(() => {
    if (showControls) {
      hideControls();
    } else {
      showControlsAnimated();
    }
  }, [showControls, hideControls, showControlsAnimated]);

  // Video Controls
  const togglePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        await videoRef.current?.pauseAsync();
      } else {
        await videoRef.current?.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, [isPlaying]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsVideoReady(true);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      
      // Update progress bar
      if (status.durationMillis && status.positionMillis !== undefined) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        Animated.timing(progressBarWidth, {
          toValue: progress,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }
    } else if (status.error) {
      console.error('Video playback error:', status.error);
      setError(`Failed to load video: ${typeof status.error === 'string' ? status.error : 'Unknown error'}`);
      setIsLoading(false);
      setIsVideoReady(false);
    }
  }, []);

  const seekTo = useCallback(async (time: number) => {
    try {
      await videoRef.current?.setPositionAsync(time);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, []);

  const changePlaybackRate = useCallback(async (rate: number) => {
    try {
      await videoRef.current?.setRateAsync(rate, true);
      setPlaybackRate(rate);
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  }, []);

  const goBack = useCallback(() => {
    clearControlsTimeout();
    // Reset orientation to portrait before going back
    lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    onBack();
  }, [clearControlsTimeout, lockOrientation, onBack]);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (isFullscreen) {
        await lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
      } else {
        await lockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [isFullscreen, lockOrientation]);

  // Exit fullscreen and go back
  const exitFullscreenAndGoBack = useCallback(() => {
    goBack();
  }, [goBack]);

  // Gesture Handling
  const handleProgressPress = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    const progressBarWidth = screenWidth - 32;
    const progress = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const newPosition = progress * duration;
    seekTo(newPosition);
  }, [duration, seekTo]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      togglePlayPause();
    }
    lastTapRef.current = now;
  }, [togglePlayPause]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      showControlsAnimated();
    },
    onPanResponderMove: (evt, gestureState) => {
      if (Math.abs(gestureState.dy) > GESTURE_THRESHOLD) {
        // Vertical swipe - could be used for volume/brightness
        return;
      }
      if (Math.abs(gestureState.dx) > GESTURE_THRESHOLD && duration > 0) {
        // Horizontal swipe - seek
        const progress = (gestureState.dx + screenWidth / 2) / screenWidth;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const newPosition = clampedProgress * duration;
        seekTo(newPosition);
      }
    },
  });

  // Error Handling
  const retryVideo = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsVideoReady(false);
    setPosition(0);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.unloadAsync().then(() => {
        videoRef.current?.loadAsync({ uri: videoUrl });
      });
    }
  }, [videoUrl]);

  const testWithSampleVideo = useCallback(() => {
    const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    setError(null);
    setIsLoading(true);
    setIsVideoReady(false);
    setPosition(0);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.unloadAsync().then(() => {
        videoRef.current?.loadAsync({ uri: sampleVideoUrl });
      });
    }
  }, []);

  // Effects
  useEffect(() => {
    // Validate video URL
    if (!validateVideoUrl(videoUrl)) {
      setError('Invalid video URL format');
      return;
    }
    
    console.log('VideoPlayerScreen: Loading video from URL:', videoUrl);
  }, [videoUrl, validateVideoUrl]);

  useEffect(() => {
    // Setup orientation listener
    const subscription = ScreenOrientation.addOrientationChangeListener(handleOrientationChange);
    
    // Lock to landscape on mount for fullscreen experience
    lockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
    
    // Handle hardware back button (Android)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true; // Prevent default behavior
    });
    
    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
      backHandler.remove();
      clearControlsTimeout();
    };
  }, [handleOrientationChange, clearControlsTimeout, lockOrientation, goBack]);

  useEffect(() => {
    // Auto-hide controls
    if (showControls) {
      startControlsTimeout();
    }
    
    return () => clearControlsTimeout();
  }, [showControls, startControlsTimeout, clearControlsTimeout]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      clearControlsTimeout();
      // Reset orientation to portrait on unmount
      lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [clearControlsTimeout, lockOrientation]);

  // Render Error Screen
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar hidden />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Video Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={retryVideo}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testButton} onPress={testWithSampleVideo}>
              <Text style={styles.testButtonText}>Test Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButtonError} onPress={goBack}>
              <Text style={styles.backButtonErrorText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main Render
  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} />
      
      {/* Video Player */}
      <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideoContainer]} {...panResponder.panHandlers}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying && isVideoReady}
          isLooping={false}
          rate={playbackRate}
          onLoadStart={() => {
            console.log('Video load started');
            setIsLoading(true);
            setError(null);
          }}
          onLoad={(status) => {
            console.log('Video loaded successfully');
            handlePlaybackStatusUpdate(status);
          }}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={(error) => {
            console.error('Video error:', error);
            setError(`Video playback failed: ${typeof error === 'string' ? error : 'Unknown error'}`);
            setIsLoading(false);
            setIsVideoReady(false);
          }}
          useNativeControls={false}
          shouldCorrectPitch={true}
          volume={1.0}
          isMuted={false}
          progressUpdateIntervalMillis={PROGRESS_UPDATE_INTERVAL}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity onPress={exitFullscreenAndGoBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {courseTitle}
              </Text>
              <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenButton}>
                <Ionicons 
                  name={isFullscreen ? "contract" : "expand"} 
                  size={24} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            </View>

            {/* Center Play Button */}
            <TouchableOpacity 
              style={styles.centerControls} 
              onPress={handleDoubleTap}
              activeOpacity={1}
            >
              <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={48} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <TouchableOpacity 
                  style={styles.progressBar} 
                  onPress={handleProgressPress}
                  activeOpacity={1}
                >
                  <View style={styles.progressTrack}>
                    <Animated.View 
                      style={[
                        styles.progressFill, 
                        { width: progressBarWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        })}
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Speed Controls */}
              <View style={styles.speedControls}>
                <Text style={styles.speedLabel}>Speed:</Text>
                {playbackRates.map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[
                      styles.speedButton,
                      playbackRate === rate && styles.speedButtonActive
                    ]}
                    onPress={() => changePlaybackRate(rate)}
                  >
                    <Text style={[
                      styles.speedButtonText,
                      playbackRate === rate && styles.speedButtonTextActive
                    ]}>
                      {rate}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Tap to show controls */}
        {!showControls && (
          <TouchableOpacity 
            style={styles.tapOverlay} 
            onPress={toggleControls}
            activeOpacity={1}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  fullscreenButton: {
    padding: 8,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  speedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  speedButtonActive: {
    backgroundColor: '#ffffff',
  },
  speedButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  speedButtonTextActive: {
    color: '#000000',
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  backButtonError: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonErrorText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VideoPlayerScreen;