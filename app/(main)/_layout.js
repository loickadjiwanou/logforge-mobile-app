import React, { useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { LogoutModal } from '../../src/components/ui/LogoutModal';
import CustomDrawerContent from '../../src/components/navigation/CustomDrawerContent';

export default function MainLayout() {
  const { colors, isDark } = useTheme();
  const { logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  return (
    <>
      <Drawer
        drawerContent={(props) => (
          <CustomDrawerContent 
            {...props} 
            onLogout={() => {
              setLogoutModalVisible(true);
            }} 
          />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: 'slide',
          drawerStyle: {
            width: '80%',
            backgroundColor: colors.background,
          },
          overlayColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          sceneContainerStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Drawer.Screen name="(stack)" />
      </Drawer>

      <LogoutModal 
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
