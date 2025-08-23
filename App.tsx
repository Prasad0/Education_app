import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {store} from './src/store/store';
import Toast from 'react-native-toast-message';
import AppInitializer from './src/components/AppInitializer';
import AuthNavigator from './src/navigation/AuthNavigator';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AppInitializer>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
        <Toast />
      </AppInitializer>
    </Provider>
  );
}

export default App;
