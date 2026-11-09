import { PrepComplexityTag } from '@dumline/shared';

export interface OrderItemForPrepEstimate {
  itemName: string;
  category: string;
  quantity: number;
  prepComplexityTag: PrepComplexityTag;
  basePrepMinutes: number;
}

export interface PrepEstimateInput {
  items: OrderItemForPrepEstimate[];
  outletMinPrepMinutes: number;
  activeOrdersCount: number;
  orderTimestamp?: Date;
}

export interface PrepEstimateResult {
  aiEstimatedMinutes: number | null;
  deterministicFallbackMinutes: number;
  activeEstimateMinutes: number;
  outletMinPrepMinutes: number;
  finalPromisedMinutes: number;
  confidence: number;
  source: 'AI' | 'DETERMINISTIC_FALLBACK';
  explanation: string;
  stationBreakdown: Record<string, number>;
}

// Kitchen Stations for Parallel Cooking Safeguard
export const KITCHEN_STATIONS = {
  BIRYANI_STATION: ['DUM_COOKING'],
  TANDOOR_STATION: ['TANDOOR'],
  CURRY_STATION: ['CURRY_STATION'],
  DESSERT_BEVERAGE_STATION: ['READY_TO_SERVE', 'DESSERT_BEVERAGE'],
} as const;

export class AiPrepService {
  /**
   * Determine kitchen station for an item based on its prep complexity tag
   */
  static getStationForTag(tag: PrepComplexityTag): string {
    if (tag === 'DUM_COOKING') return 'BIRYANI_STATION';
    if (tag === 'TANDOOR') return 'TANDOOR_STATION';
    if (tag === 'CURRY_STATION') return 'CURRY_STATION';
    return 'DESSERT_BEVERAGE_STATION';
  }

  /**
   * Determine whether current time or order time is during peak lunch/dinner rush
   */
  static isPeakHour(date: Date = new Date()): boolean {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeNum = hours + minutes / 60;
    // Lunch rush: 12:30 - 15:00, Dinner rush: 19:30 - 22:30
    const isLunchPeak = timeNum >= 12.5 && timeNum <= 15.0;
    const isDinnerPeak = timeNum >= 19.5 && timeNum <= 22.5;
    return isLunchPeak || isDinnerPeak;
  }

  /**
   * Deterministic Fallback Formula:
   * Station-aware parallel cooking calculation avoiding additive multiplication of concurrent stations.
   *
   * Fallback = Staging Buffer (5m) + max_{s in Stations}(Station Time) + (Active Orders * 2m)
   * where Station Time = max(item base prep) + sum((quantity - 1) * 2m fractional portion factor)
   */
  static calculateDeterministicFallback(
    items: OrderItemForPrepEstimate[],
    activeOrdersCount: number,
    isPeak: boolean
  ): { fallbackMinutes: number; stationBreakdown: Record<string, number>; explanation: string } {
    const stationItems: Record<string, OrderItemForPrepEstimate[]> = {
      BIRYANI_STATION: [],
      TANDOOR_STATION: [],
      CURRY_STATION: [],
      DESSERT_BEVERAGE_STATION: [],
    };

    items.forEach((item) => {
      const station = this.getStationForTag(item.prepComplexityTag);
      stationItems[station].push(item);
    });

    const stationBreakdown: Record<string, number> = {};
    let maxStationCookTime = 0;
    let bottleneckStation = 'BIRYANI_STATION';

    for (const [station, sItems] of Object.entries(stationItems)) {
      if (sItems.length === 0) {
        stationBreakdown[station] = 0;
        continue;
      }

      // Maximum single dish base prep time in this station
      const basePrep = Math.max(...sItems.map((i) => i.basePrepMinutes));

      // Fractional scale factor: +2 minutes per additional portion in the same station
      const additionalPortions = sItems.reduce((acc, i) => acc + (i.quantity - 1), 0);
      const additionalItemCount = sItems.length > 1 ? (sItems.length - 1) * 1 : 0;
      const stationTime = basePrep + additionalPortions * 2 + additionalItemCount;

      stationBreakdown[station] = stationTime;

      if (stationTime > maxStationCookTime) {
        maxStationCookTime = stationTime;
        bottleneckStation = station;
      }
    }

    // Workload factor: 2 minutes per active cooking order at outlet
    const workloadMinutes = activeOrdersCount * 2;

    // Peak rush buffer: +3 minutes if during peak rush
    const peakBuffer = isPeak ? 3 : 0;

    // Staging, packing, and quality check buffer: 5 minutes
    const stagingBuffer = 5;

    const rawTotal = stagingBuffer + maxStationCookTime + workloadMinutes + peakBuffer;
    // Clamp to realistic bounds [10, 120] minutes
    const fallbackMinutes = Math.min(120, Math.max(10, Math.round(rawTotal)));

    const explanation =
      `Parallel station calculation: Staging buffer (5m) + bottleneck station (${bottleneckStation}: ${maxStationCookTime}m) ` +
      `+ active kitchen load (${activeOrdersCount} active orders: ${workloadMinutes}m)` +
      (peakBuffer > 0 ? ` + peak hour adjustment (${peakBuffer}m)` : '') +
      ` = ${fallbackMinutes} minutes.`;

    return { fallbackMinutes, stationBreakdown, explanation };
  }

  /**
   * Main preparation time estimator integrating AI model and deterministic fallback
   * Enforces: T_Promised = max(E_Active, T_Min)
   */
  static async estimatePrepTime(input: PrepEstimateInput): Promise<PrepEstimateResult> {
    const orderDate = input.orderTimestamp || new Date();
    const isPeak = this.isPeakHour(orderDate);

    // 1. Calculate deterministic fallback baseline
    const { fallbackMinutes, stationBreakdown, explanation: fallbackExplanation } =
      this.calculateDeterministicFallback(input.items, input.activeOrdersCount, isPeak);

    let aiMinutes: number | null = null;
    let confidence = 0.95;
    let explanation = fallbackExplanation;
    let source: 'AI' | 'DETERMINISTIC_FALLBACK' = 'DETERMINISTIC_FALLBACK';

    // 2. Real AI Service Integration (Google Gemini API) if configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'demo_key') {
      try {
        const prompt = `You are the Executive Khansama and Kitchen Operations Dispatcher for DUMLINE, an authentic Hyderabadi Dum Biryani restaurant chain.
Estimate the realistic preparation time (in minutes) for the following kitchen order.
Consider parallel cooking stations (Biryani station, Tandoor station, Curry station, and Dessert station cook simultaneously).
Do NOT additively multiply cook times for items prepared at separate stations.

Order Items:
${input.items.map((i) => `- ${i.quantity}x ${i.itemName} (${i.category}, complexity: ${i.prepComplexityTag}, base cook: ${i.basePrepMinutes}m)`).join('\n')}

Outlet State:
- Active orders currently cooking in kitchen: ${input.activeOrdersCount}
- Outlet minimum logistical floor: ${input.outletMinPrepMinutes} minutes
- Peak hour rush: ${isPeak ? 'YES' : 'NO'}

Respond ONLY with a valid JSON object matching this schema:
{
  "estimatedMinutes": number (between 10 and 120),
  "confidence": number (between 0.0 and 1.0),
  "explanation": string (concise explanation of station parallelization and load factor)
}`;

        // 2.5 second abort timeout so AI never stalls checkout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const resData: any = await response.json();
          const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (typeof parsed.estimatedMinutes === 'number' && parsed.estimatedMinutes >= 5 && parsed.estimatedMinutes <= 120) {
              aiMinutes = Math.round(parsed.estimatedMinutes);
              confidence = typeof parsed.confidence === 'number' ? Math.max(0.1, Math.min(1.0, parsed.confidence)) : 0.9;
              explanation = parsed.explanation || 'AI estimated parallel station preparation schedule.';
              source = 'AI';
            }
          }
        }
      } catch {
        // AI service unavailable, timed out, or returned invalid JSON -> Use deterministic fallback
        source = 'DETERMINISTIC_FALLBACK';
      }
    }

    // 3. Active estimate
    const activeEstimateMinutes = aiMinutes !== null ? aiMinutes : fallbackMinutes;

    // 4. Binding Promised Preparation Time Rule:
    // T_Promised = max(E_Active, T_Min)
    const finalPromisedMinutes = Math.max(activeEstimateMinutes, input.outletMinPrepMinutes);

    return {
      aiEstimatedMinutes: aiMinutes,
      deterministicFallbackMinutes: fallbackMinutes,
      activeEstimateMinutes,
      outletMinPrepMinutes: input.outletMinPrepMinutes,
      finalPromisedMinutes,
      confidence,
      source,
      explanation,
      stationBreakdown,
    };
  }
}

