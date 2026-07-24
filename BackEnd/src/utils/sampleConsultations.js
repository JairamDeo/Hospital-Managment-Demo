/**
 * Sample doctor–patient discussions for testing without a microphone / STT.
 * Used when the client does not send discussionText.
 */
export const SAMPLE_CONSULTATIONS = [
  {
    id: 'diabetes-followup',
    title: 'Diabetes / Madhumeha follow-up',
    discussionText: `Doctor: Good morning. How have you been feeling since the last visit?
Patient: Namaste Doctor. My thirst is still high, and I wake up 2–3 times at night to pass urine. Energy is low after lunch.
Doctor: Any chest pain, blurred vision, or foot numbness?
Patient: Mild tingling in both feet at night. No chest pain. Vision is okay.
Doctor: Are you taking the medicines I prescribed last time?
Patient: Yes, Yashtimadhu syrup morning and evening. I also take Triphala at night. Diet is mostly chapati and vegetables; I still eat sweets on Sundays.
Doctor: Any recent blood sugar reports from outside?
Patient: Last week fasting was around 148 and after food about 220. I don't have the paper with me.
Doctor: Weight changes?
Patient: Slightly gained — about 2 kg in a month.
Doctor: Bowels? Sleep?
Patient: Constipation on some days. Sleep is disturbed because of urine at night.
Doctor: Any fever or infection recently?
Patient: No.
Doctor: Alright. We should recheck fasting, PPBS, and HbA1c, and review your medicines and diet plan today.`,
  },
  {
    id: 'joint-pain',
    title: 'Joint pain / Sandhivata',
    discussionText: `Doctor: Tell me about your main complaint today.
Patient: Pain in both knees for 3 months, worse in the morning and when I climb stairs. Mild swelling on the right knee.
Doctor: Any injury? Fever? Redness of joints?
Patient: No injury. No fever. Slight warmth sometimes after walking long.
Doctor: Digestion and appetite?
Patient: Appetite is okay. Gas and bloating after heavy meals. Prefer warm food.
Doctor: Prakriti or previous Ayurvedic treatment?
Patient: Earlier doctor said Vata predominance. I did local Abhyanga for a week last month — temporary relief.
Doctor: Current medicines or painkillers?
Patient: Occasional Allopathic pain tablet when pain is severe — maybe twice a week.
Doctor: We will examine the knees, check if X-ray or blood tests are needed, and plan Snehana / Swedana or internal medicines.`,
  },
  {
    id: 'gastric',
    title: 'Acidity / Amlapitta',
    discussionText: `Doctor: What brings you in today?
Patient: Burning in the chest and throat for 2 weeks, worse after spicy food and late dinner. Sour burps.
Doctor: Vomiting, black stools, weight loss?
Patient: No vomiting, stools normal, no weight loss. Stress at work is high.
Doctor: Sleep and meal timing?
Patient: Dinner after 10 PM. Sleep around midnight. Tea 3–4 times a day.
Doctor: Any ongoing medicines?
Patient: Antacid syrup as needed. No regular Ayurvedic medicine now.
Doctor: We will focus on diet timing, reduce tea, and start mild Deepana-Pachana and soothing medicines. If symptoms persist we may suggest endoscopy later — not urgently needed now.`,
  },
];

export const getSampleDiscussion = (sampleId) => {
  if (sampleId) {
    const found = SAMPLE_CONSULTATIONS.find((s) => s.id === sampleId);
    if (found) return found;
  }
  return SAMPLE_CONSULTATIONS[0];
};
