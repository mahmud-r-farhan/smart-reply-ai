import { motion } from "framer-motion";
import { Send } from "lucide-react";

const EmptyState = ({ loading, results, input }) => {
  if (loading || results.length > 0 || input.length > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-12 text-center"
    >
      <div className="inline-flex p-4 bg-slate-800/50 rounded-2xl mb-4">
        <Send className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-slate-500 mb-2">Enter text to get started</p>
      <p className="text-sm text-slate-600 max-w-md mx-auto">
        Our AI analyzes context, tone, and intent to craft responses, enhancements, or translations that sound natural and effective.
      </p>
    </motion.div>
  );
};

export default EmptyState;