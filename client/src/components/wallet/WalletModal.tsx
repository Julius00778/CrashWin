import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onTransaction: (type: 'deposit' | 'withdraw', amount: number) => void;
}

export default function WalletModal({ isOpen, onClose, currentBalance, onTransaction }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTransaction = async () => {
    const transactionAmount = parseFloat(amount);
    if (!transactionAmount || transactionAmount <= 0) return;

    if (activeTab === 'withdraw' && transactionAmount > currentBalance) {
      alert("Insufficient balance");
      return;
    }

    setLoading(true);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onTransaction(activeTab, transactionAmount);
    setAmount("");
    setLoading(false);
    onClose();
    
    alert(`${activeTab === 'deposit' ? 'Deposit' : 'Withdrawal'} of ₹${transactionAmount} successful!`);
  };

  const quickAmounts = [100, 500, 1000, 5000, 10000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 z-10"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-gold to-accent-green bg-clip-text text-transparent">
            Wallet
          </h2>
          <p className="text-gray-400 mt-1">
            Current Balance: <span className="text-accent-gold font-semibold">₹{currentBalance.toFixed(2)}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'deposit' 
                  ? 'bg-accent-green text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'withdraw' 
                  ? 'bg-accent-red text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Amount (₹)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm bg-gray-700 border border-gray-600 border-r-0 rounded-l-xl">
                ₹
              </span>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 rounded-r-xl text-white"
                min="1"
                max={activeTab === 'withdraw' ? currentBalance : 100000}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Quick Select
            </label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={activeTab === 'withdraw' && quickAmount > currentBalance}
                  className="py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ₹{quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              {activeTab === 'deposit' ? 'Payment Method' : 'Withdrawal Method'}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              {activeTab === 'deposit' ? (
                <>
                  <option value="upi">UPI (Recommended)</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="wallet">Digital Wallet</option>
                </>
              ) : (
                <>
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="wallet">Digital Wallet</option>
                </>
              )}
            </select>
          </div>

          {/* Transaction Button */}
          <Button
            onClick={handleTransaction}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className={`w-full py-3 font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-accent-green to-green-600 hover:from-green-600 hover:to-accent-green text-black'
                : 'bg-gradient-to-r from-accent-red to-red-600 hover:from-red-600 hover:to-accent-red text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                Processing...
              </div>
            ) : (
              `${activeTab === 'deposit' ? 'Deposit' : 'Withdraw'} ₹${amount || '0'}`
            )}
          </Button>

          {/* Info */}
          <div className="text-xs text-gray-400 space-y-1">
            {activeTab === 'deposit' ? (
              <>
                <p>• Deposits are processed instantly</p>
                <p>• Minimum deposit: ₹100</p>
                <p>• No deposit fees</p>
              </>
            ) : (
              <>
                <p>• Withdrawals processed within 24 hours</p>
                <p>• Minimum withdrawal: ₹100</p>
                <p>• Available balance: ₹{currentBalance.toFixed(2)}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}