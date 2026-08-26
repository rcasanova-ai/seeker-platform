export interface ApprovalRequest {
  requestingApplication: string;
  requestingActor: string;
  provider: string;
  purpose: string;
  amount: number;
  asset: string;
}

export interface ApprovalResponse {
  approved: boolean;
  approvedAmount: number;
  approver?: string;
  reason?: string;
}

export interface HumanApprovalProvider {
  requestApproval(request: ApprovalRequest): Promise<ApprovalResponse>;
}

export class StaticApprovalProvider implements HumanApprovalProvider {
  constructor(private readonly response: ApprovalResponse) {}

  async requestApproval(): Promise<ApprovalResponse> {
    return this.response;
  }
}
