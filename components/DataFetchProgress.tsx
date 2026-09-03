"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import type { FetchTask } from "@/lib/store";

interface DataFetchProgressProps {
  tasks: FetchTask[];
}

export default function DataFetchProgress({ tasks }: DataFetchProgressProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4 }}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 ${
              task.status === "verified"
                ? "bg-success/5 border-success/20"
                : task.status === "failed"
                ? "bg-error/5 border-error/20"
                : task.status === "fetching"
                ? "bg-accent/5 border-accent/20"
                : "bg-white border-card-border"
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {task.status === "waiting" && (
                <Clock className="h-5 w-5 text-text-muted" />
              )}
              {task.status === "fetching" && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Loader2 className="h-5 w-5 text-accent" />
                </motion.div>
              )}
              {task.status === "verified" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <CheckCircle className="h-5 w-5 text-success" />
                </motion.div>
              )}
              {task.status === "failed" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <XCircle className="h-5 w-5 text-error" />
                </motion.div>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  task.status === "waiting"
                    ? "text-text-muted"
                    : task.status === "fetching"
                    ? "text-accent"
                    : task.status === "verified"
                    ? "text-text-primary"
                    : "text-error"
                }`}
              >
                {task.label}
              </p>

              {/* Shimmer while fetching */}
              {task.status === "fetching" && (
                <div className="mt-2 h-4 bg-gray-100 rounded shimmer-bg w-3/4" />
              )}

              {/* Result */}
              <AnimatePresence>
                {task.status === "verified" && task.result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <p className="text-sm text-success font-medium">
                      {task.result}
                    </p>
                    {task.apiBadge && (
                      <span
                        className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: task.apiColor || "#1C5AA0" }}
                      >
                        {task.apiBadge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {task.status === "failed" && task.error && (
                <p className="text-sm text-error mt-1">{task.error}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
