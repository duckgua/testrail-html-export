import HtmlContent from '@/components/ui/HtmlContent'
import type { Case } from '@/lib/testrail/types'

interface StepExpanderProps {
  caseDetail: Case
}

export default function StepExpander({ caseDetail }: StepExpanderProps) {
  const hasStructuredSteps =
    caseDetail.custom_steps_separated &&
    caseDetail.custom_steps_separated.length > 0

  if (hasStructuredSteps) {
    return (
      <div className="space-y-3">
        {caseDetail.custom_steps_separated!.map((step, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500">步驟 {i + 1}</span>
            </div>
            <div className="p-3 space-y-2">
              {step.content && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-0.5">操作</p>
                  <HtmlContent html={step.content} />
                </div>
              )}
              {step.expected && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-0.5">預期結果</p>
                  <HtmlContent html={step.expected} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Fallback: plain text / HTML steps
  const hasSteps = caseDetail.custom_steps
  const hasExpected = caseDetail.custom_expected
  const hasPreconds = caseDetail.custom_preconds

  if (!hasSteps && !hasExpected && !hasPreconds) {
    return <p className="text-sm text-gray-400">沒有測試步驟資料。</p>
  }

  return (
    <div className="space-y-3">
      {hasPreconds && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">前置條件</p>
          <div className="rounded bg-white border border-gray-200 p-3">
            <HtmlContent html={caseDetail.custom_preconds} />
          </div>
        </div>
      )}
      {hasSteps && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">測試步驟</p>
          <div className="rounded bg-white border border-gray-200 p-3">
            <HtmlContent html={caseDetail.custom_steps} />
          </div>
        </div>
      )}
      {hasExpected && (
        <div>
          <p className="text-xs font-medium text-green-600 mb-1">預期結果</p>
          <div className="rounded bg-white border border-green-100 p-3">
            <HtmlContent html={caseDetail.custom_expected} />
          </div>
        </div>
      )}
    </div>
  )
}
