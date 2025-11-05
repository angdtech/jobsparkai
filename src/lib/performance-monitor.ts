// Performance monitoring utility for CV analysis improvements

export interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  apiCalls: number
  parallelCalls: number
  cacheHits: number
  memoryUsed?: number
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map()

  startOperation(operationId: string, apiCalls: number = 1, parallelCalls: number = 1): void {
    this.metrics.set(operationId, {
      startTime: Date.now(),
      apiCalls,
      parallelCalls,
      cacheHits: 0
    })
  }

  endOperation(operationId: string): PerformanceMetrics | null {
    const metric = this.metrics.get(operationId)
    if (!metric) return null

    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime
    metric.memoryUsed = this.getMemoryUsage()

    return metric
  }

  recordCacheHit(operationId: string): void {
    const metric = this.metrics.get(operationId)
    if (metric) {
      metric.cacheHits++
    }
  }

  getMetrics(operationId: string): PerformanceMetrics | null {
    return this.metrics.get(operationId) || null
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics)
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  generateReport(operationId: string): string {
    const metric = this.metrics.get(operationId)
    if (!metric || !metric.duration) return 'No metrics available'

    const parallelEfficiency = metric.parallelCalls > 1 
      ? `${((metric.apiCalls / metric.parallelCalls) * 100).toFixed(1)}% parallel efficiency`
      : 'Sequential processing'

    return `
Performance Report for ${operationId}:
- Duration: ${metric.duration}ms
- API Calls: ${metric.apiCalls}
- Parallel Calls: ${metric.parallelCalls}
- ${parallelEfficiency}
- Cache Hits: ${metric.cacheHits}
- Memory Used: ${metric.memoryUsed ? `${(metric.memoryUsed / 1024 / 1024).toFixed(2)}MB` : 'N/A'}
    `.trim()
  }

  private getMemoryUsage(): number {
    // Browser environment
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      return (window.performance as any).memory.usedJSHeapSize
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    
    return 0
  }

  compareOperations(operation1Id: string, operation2Id: string): string {
    const metric1 = this.metrics.get(operation1Id)
    const metric2 = this.metrics.get(operation2Id)
    
    if (!metric1 || !metric2 || !metric1.duration || !metric2.duration) {
      return 'Cannot compare - insufficient data'
    }

    const speedImprovement = ((metric1.duration - metric2.duration) / metric1.duration * 100).toFixed(1)
    const faster = metric2.duration < metric1.duration ? operation2Id : operation1Id
    const slower = metric2.duration < metric1.duration ? operation1Id : operation2Id

    return `
Performance Comparison:
- ${operation1Id}: ${metric1.duration}ms (${metric1.apiCalls} calls, ${metric1.parallelCalls} parallel)
- ${operation2Id}: ${metric2.duration}ms (${metric2.apiCalls} calls, ${metric2.parallelCalls} parallel)
- ${faster} is ${Math.abs(parseFloat(speedImprovement))}% faster than ${slower}
    `.trim()
  }
}

// Global instance for easy access
export const performanceMonitor = new PerformanceMonitor()

// Utility function to measure async operations
export async function measureAsync<T>(
  operationId: string,
  operation: () => Promise<T>,
  apiCalls: number = 1,
  parallelCalls: number = 1
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  performanceMonitor.startOperation(operationId, apiCalls, parallelCalls)
  
  try {
    const result = await operation()
    const metrics = performanceMonitor.endOperation(operationId)!
    return { result, metrics }
  } catch (error) {
    performanceMonitor.endOperation(operationId)
    throw error
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    startOperation: performanceMonitor.startOperation.bind(performanceMonitor),
    endOperation: performanceMonitor.endOperation.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    compareOperations: performanceMonitor.compareOperations.bind(performanceMonitor)
  }
}