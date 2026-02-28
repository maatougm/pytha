import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useParent } from '@/src/hooks/useParent';
import { useFeePayments } from '@/src/hooks/useParent';
import { Header } from '@/src/components/Header';
import { Card } from '@/src/components/Card';

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'bank', name: 'Bank Transfer', icon: DollarSign },
];

export default function PaymentsScreen() {
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const { selectedChild } = useParent();
  const { payments, history, isLoading, totalDue, totalPaid, makePayment, refresh } = useFeePayments(
    selectedChild?.id
  );

  const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedPayment) return;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (paymentAmount > selectedPayment.amount - (selectedPayment.paidAmount || 0)) {
      Alert.alert('Invalid Amount', 'Amount exceeds remaining balance');
      return;
    }

    setIsProcessing(true);

    const result = await makePayment(
      selectedPayment.id,
      paymentAmount,
      paymentMethod,
      {}
    );

    setIsProcessing(false);
    setShowPaymentModal(false);

    if (result.success) {
      Alert.alert(
        'Payment Successful',
        `Transaction ID: ${result.transactionId}`,
        [{ text: 'OK', onPress: refresh }]
      );
    } else {
      Alert.alert('Payment Failed', result.error || 'Please try again');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'partial':
        return colors.warning;
      case 'overdue':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'partial':
        return Clock;
      case 'overdue':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    // Summary Card
    summaryCard: {
      flexDirection: 'row',
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    summaryValue: {
      fontFamily: fonts.bold,
      fontSize: fontSizes['2xl'],
      color: colors.text,
    },
    summaryLabel: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    // Section
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.lg,
      color: colors.text,
      marginBottom: spacing.md,
    },
    // Payment Item
    paymentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    paymentIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    paymentDesc: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    paymentDue: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginTop: 2,
    },
    paymentAmount: {
      alignItems: 'flex-end',
    },
    amountText: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.lg,
      color: colors.text,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
    },
    statusText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      marginLeft: 4,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.xl,
      color: colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    inputLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSizes.base,
      color: colors.text,
      backgroundColor: colors.background,
    },
    paymentMethods: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    methodButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      gap: spacing.sm,
    },
    methodText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
    },
    payButton: {
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    payButtonText: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.base,
      color: colors.primaryForeground,
    },
    payButtonDisabled: {
      opacity: 0.5,
    },
    // History Item
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    historyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.success + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    historyInfo: {
      flex: 1,
    },
    historyTitle: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    historyDate: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
    },
    historyAmount: {
      fontFamily: fonts.bold,
      fontSize: fontSizes.base,
      color: colors.success,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Fee Payments" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              ${totalDue.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total Due</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              ${totalPaid.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
        </Card>

        {/* Pending Payments */}
        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Payments</Text>

            {payments.map(payment => {
              const StatusIcon = getStatusIcon(payment.status);
              const remaining = payment.amount - (payment.paidAmount || 0);

              return (
                <TouchableOpacity
                  key={payment.id}
                  style={styles.paymentItem}
                  onPress={() => {
                    setSelectedPayment(payment);
                    setAmount(remaining.toString());
                    setShowPaymentModal(true);
                  }}
                >
                  <View
                    style={[
                      styles.paymentIcon,
                      { backgroundColor: getStatusColor(payment.status) + '20' },
                    ]}
                  >
                    <StatusIcon size={24} color={getStatusColor(payment.status)} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentTitle}>{payment.description}</Text>
                    <Text style={styles.paymentDesc}>
                      {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} Fee
                    </Text>
                    <Text style={styles.paymentDue}>
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.paymentAmount}>
                    <Text style={styles.amountText}>${remaining.toFixed(2)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '20' },
                      ]}
                    >
                      <StatusIcon size={12} color={getStatusColor(payment.status)} />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(payment.status) },
                        ]}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Payment History */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>

            {history.slice(0, 5).map(payment => (
              <View key={payment.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <CheckCircle size={20} color={colors.success} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{payment.description}</Text>
                  <Text style={styles.historyDate}>
                    Paid on {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : 'N/A'}
                    {' • '}
                    {payment.paymentMethod}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>${(payment.paidAmount || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedPayment && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment For</Text>
                  <Text style={{ fontSize: fontSizes.base, color: colors.text }}>
                    {selectedPayment.description}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount Due</Text>
                  <Text style={{ fontSize: fontSizes.lg, fontWeight: 'bold', color: colors.text }}>
                    ${(selectedPayment.amount - (selectedPayment.paidAmount || 0)).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="Enter amount"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.paymentMethods}>
                    {PAYMENT_METHODS.map(method => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;

                      return (
                        <TouchableOpacity
                          key={method.id}
                          style={[
                            styles.methodButton,
                            {
                              borderColor: isSelected ? colors.primary : colors.border,
                              backgroundColor: isSelected ? colors.primary + '10' : colors.background,
                            },
                          ]}
                          onPress={() => setPaymentMethod(method.id)}
                        >
                          <Icon size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                          <Text
                            style={[
                              styles.methodText,
                              { color: isSelected ? colors.primary : colors.text },
                            ]}
                          >
                            {method.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
                  onPress={handlePayment}
                  disabled={isProcessing}
                >
                  <Text style={styles.payButtonText}>
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
