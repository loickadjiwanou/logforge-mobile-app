import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Animated, Platform, Pressable } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Select = ({ label, value, options, onSelect, placeholder = 'Select an option', containerStyle }) => {
  const { colors, primaryColor } = useTheme();
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  const selectedOption = options.find(o => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      
      <TouchableOpacity 
        onPress={() => setVisible(true)}
        style={[styles.selectBox, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.valueText, { color: selectedOption ? colors.text : colors.textMuted }]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable 
          style={styles.overlay} 
          onPress={() => setVisible(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.card, 
                paddingBottom: insets.bottom + 20,
                borderTopColor: colors.border,
                borderTopWidth: 1
              }
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                  style={[styles.optionItem, { borderBottomColor: colors.border + '40' }]}
                >
                  <Text style={[
                     styles.optionLabel, 
                     { color: item.value === value ? primaryColor : colors.text }
                  ]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Check size={18} color={primaryColor} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  selectBox: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  valueText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
