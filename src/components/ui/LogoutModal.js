import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LogOut, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing, radius, typography } from '../../theme';
import { Button } from './Button';

const { width } = Dimensions.get('window');

export const LogoutModal = ({ visible, onClose, onConfirm }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.iconBox, { backgroundColor: colors.error + '20' }]}>
            <LogOut size={24} color={colors.error} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t('signOut')}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {t('signOutConfirm')}
          </Text>

          <View style={styles.footer}>
            <Button
              variant="outline"
              title={t('cancel')}
              onPress={onClose}
              style={styles.button}
            />
            <Button
              variant="destructive"
              title={t('signOut')}
              onPress={onConfirm}
              style={[styles.button, { marginLeft: spacing.md }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 44,
  },
});
