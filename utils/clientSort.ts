export interface ClientWithAssessments {
  id: string;
  name: string;
  created_at: string;
  physical_assessments?: Array<{
    id: string;
    assessment_date: string;
    import_source?: string;
  }>;
  [key: string]: any;
}

export function getEffectiveRegistrationDate(client: ClientWithAssessments): string {
  if (!client.physical_assessments || client.physical_assessments.length === 0) {
    return client.created_at;
  }

  const fineshapeAssessments = client.physical_assessments.filter(
    (pa) => pa.import_source === 'fineshape'
  );

  if (fineshapeAssessments.length === 0) {
    return client.created_at;
  }

  const earliestDate = fineshapeAssessments.reduce((earliest, current) => {
    return current.assessment_date < earliest ? current.assessment_date : earliest;
  }, fineshapeAssessments[0].assessment_date);

  return earliestDate;
}
