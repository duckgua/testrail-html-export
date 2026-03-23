import { signIn, signOut, auth } from '@/auth'

export default async function UnauthorizedPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">無權限存取</h1>
        <p className="text-gray-500 text-sm mb-2">
          你的帳號（{session?.user?.email ?? '未知'}）沒有存取此 Dashboard 的權限。
        </p>
        <p className="text-gray-400 text-xs mb-8">
          請使用公司 @17.media 帳號登入，或聯絡管理員申請存取權限。
        </p>

        <div className="flex flex-col gap-3">
          {/* Switch account */}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              使用其他帳號登入
            </button>
          </form>

          {/* Sign out */}
          {session?.user && (
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/login' })
              }}
            >
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                登出
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
