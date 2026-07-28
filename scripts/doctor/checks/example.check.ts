import type { DoctorCheck, DoctorResult } from "../types";

const exampleCheck: DoctorCheck = {
  id: "SYSTEM-001",
  category: "Configuration",
  async run(): Promise<DoctorResult> {
    return {
      id: "SYSTEM-001",
      category: "Configuration",
      status: "INFO",
      summary: "Doctor framework initialized successfully.",
      details: [
        "All core modules loaded: types, registry, reporters",
        "Check registration system is operational",
      ],
    };
  },
};

export default exampleCheck;
