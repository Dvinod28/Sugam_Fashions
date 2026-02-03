import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-pink-100 text-pink-700 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        {trend && (
          <div className={`ml-auto text-sm ${trend.positive ? "text-green-600" : "text-red-600"}`}>
            {trend.positive ? "+" : "-"}
            {trend.value}%
          </div>
        )}
      </div>
    </motion.div>
  );
}


