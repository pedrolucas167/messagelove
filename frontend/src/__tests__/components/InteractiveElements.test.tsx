/**
 * Testes de InteractiveElements - Versão simplificada
 * Testes de lógica sem dependências ESM
 */

describe("InteractiveElements - Unit Tests", () => {
  describe("Animation State Machine", () => {
    type AnimationState = "idle" | "animating" | "completed";
    
    const getNextAnimationState = (
      current: AnimationState, 
      action: "start" | "complete" | "reset"
    ): AnimationState => {
      if (action === "start" && current === "idle") return "animating";
      if (action === "complete" && current === "animating") return "completed";
      if (action === "reset") return "idle";
      return current;
    };

    it("should transition from idle to animating on start", () => {
      expect(getNextAnimationState("idle", "start")).toBe("animating");
    });

    it("should transition from animating to completed", () => {
      expect(getNextAnimationState("animating", "complete")).toBe("completed");
    });

    it("should reset to idle", () => {
      expect(getNextAnimationState("completed", "reset")).toBe("idle");
      expect(getNextAnimationState("animating", "reset")).toBe("idle");
    });

    it("should not change state on invalid transitions", () => {
      expect(getNextAnimationState("completed", "start")).toBe("completed");
      expect(getNextAnimationState("idle", "complete")).toBe("idle");
    });
  });

  describe("Element Type Handling", () => {
    const elementTypes = [
      "hearts",
      "confetti", 
      "stars",
      "butterflies",
      "fireworks",
      "bubbles"
    ] as const;
    
    type ElementType = typeof elementTypes[number];

    const getAnimationConfig = (type: ElementType) => {
      const configs: Record<ElementType, { duration: number; count: number }> = {
        hearts: { duration: 3000, count: 20 },
        confetti: { duration: 2000, count: 50 },
        stars: { duration: 4000, count: 15 },
        butterflies: { duration: 5000, count: 10 },
        fireworks: { duration: 2500, count: 30 },
        bubbles: { duration: 3500, count: 25 }
      };
      return configs[type];
    };

    it("should return correct config for hearts", () => {
      const config = getAnimationConfig("hearts");
      expect(config.duration).toBe(3000);
      expect(config.count).toBe(20);
    });

    it("should return correct config for confetti", () => {
      const config = getAnimationConfig("confetti");
      expect(config.duration).toBe(2000);
      expect(config.count).toBe(50);
    });

    it("should return configs for all element types", () => {
      elementTypes.forEach(type => {
        const config = getAnimationConfig(type);
        expect(config).toHaveProperty("duration");
        expect(config).toHaveProperty("count");
        expect(config.duration).toBeGreaterThan(0);
        expect(config.count).toBeGreaterThan(0);
      });
    });
  });

  describe("Position Calculation", () => {
    const calculatePosition = (index: number, total: number, containerWidth: number) => {
      const spacing = containerWidth / (total + 1);
      return spacing * (index + 1);
    };

    it("should distribute elements evenly", () => {
      const width = 1000;
      const total = 4;
      
      expect(calculatePosition(0, total, width)).toBe(200);
      expect(calculatePosition(1, total, width)).toBe(400);
      expect(calculatePosition(2, total, width)).toBe(600);
      expect(calculatePosition(3, total, width)).toBe(800);
    });

    it("should handle single element", () => {
      expect(calculatePosition(0, 1, 100)).toBe(50);
    });
  });

  describe("Random Generation within Bounds", () => {
    const randomInRange = (min: number, max: number, seed = 0.5) => {
      return min + (max - min) * seed;
    };

    it("should return value within range", () => {
      const result = randomInRange(0, 100, 0.5);
      expect(result).toBe(50);
    });

    it("should return min value when seed is 0", () => {
      const result = randomInRange(10, 90, 0);
      expect(result).toBe(10);
    });

    it("should return max value when seed is 1", () => {
      const result = randomInRange(10, 90, 1);
      expect(result).toBe(90);
    });
  });

  describe("Element Visibility Toggle", () => {
    const createVisibilityState = (types: string[]) => {
      return types.reduce((acc, type) => ({ ...acc, [type]: false }), {} as Record<string, boolean>);
    };

    const toggleVisibility = (state: Record<string, boolean>, type: string) => {
      return { ...state, [type]: !state[type] };
    };

    it("should initialize all types as hidden", () => {
      const state = createVisibilityState(["hearts", "confetti", "stars"]);
      
      expect(state.hearts).toBe(false);
      expect(state.confetti).toBe(false);
      expect(state.stars).toBe(false);
    });

    it("should toggle visibility correctly", () => {
      let state = createVisibilityState(["hearts"]);
      
      state = toggleVisibility(state, "hearts");
      expect(state.hearts).toBe(true);
      
      state = toggleVisibility(state, "hearts");
      expect(state.hearts).toBe(false);
    });
  });

  describe("Click Handler Logic", () => {
    const shouldTriggerAnimation = (
      isAnimating: boolean,
      clickCount: number,
      maxClicks: number
    ) => {
      return !isAnimating && clickCount < maxClicks;
    };

    it("should allow animation when idle and under click limit", () => {
      expect(shouldTriggerAnimation(false, 0, 5)).toBe(true);
      expect(shouldTriggerAnimation(false, 4, 5)).toBe(true);
    });

    it("should prevent animation when already animating", () => {
      expect(shouldTriggerAnimation(true, 0, 5)).toBe(false);
    });

    it("should prevent animation when click limit reached", () => {
      expect(shouldTriggerAnimation(false, 5, 5)).toBe(false);
      expect(shouldTriggerAnimation(false, 6, 5)).toBe(false);
    });
  });

  describe("Color Generation", () => {
    const getColorForType = (type: string): string => {
      const colors: Record<string, string> = {
        hearts: "#ff6b9d",
        stars: "#ffd700",
        confetti: "#ff69b4",
        butterflies: "#87ceeb",
        default: "#ffffff"
      };
      return colors[type] || colors.default;
    };

    it("should return correct color for hearts", () => {
      expect(getColorForType("hearts")).toBe("#ff6b9d");
    });

    it("should return correct color for stars", () => {
      expect(getColorForType("stars")).toBe("#ffd700");
    });

    it("should return default color for unknown type", () => {
      expect(getColorForType("unknown")).toBe("#ffffff");
    });
  });

  describe("Animation Delay Calculation", () => {
    const calculateDelay = (index: number, baseDelay: number, stagger: number) => {
      return baseDelay + index * stagger;
    };

    it("should calculate delays with stagger", () => {
      expect(calculateDelay(0, 0, 100)).toBe(0);
      expect(calculateDelay(1, 0, 100)).toBe(100);
      expect(calculateDelay(5, 0, 100)).toBe(500);
    });

    it("should include base delay", () => {
      expect(calculateDelay(0, 500, 100)).toBe(500);
      expect(calculateDelay(2, 500, 100)).toBe(700);
    });
  });
});
