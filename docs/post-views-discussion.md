# 아티클과 노트 조회수 도입 논의

작성일: 2026-11-15

상태: 조회수 도입 보류. 현재 정적 배포를 유지하고, 사용자가 본문에 빠르게 접근해 읽을 수 있도록 하는 것을 우선한다.

## 목적과 현재 구성

아티클과 노트가 얼마나 읽히는지 파악하고, 각 상세 페이지의 메타 정보 영역에 조회수를 간결하게 표시하는 방안을 논의했다. 아티클에서는 날짜·카테고리·읽기 시간 옆에 조회수를 배치하는 구상이다. 노트에도 같은 집계·표시 원칙을 적용한다.

마지막으로 확인한 블로그는 Astro 7의 정적 빌드 결과를 Cloudflare Pages에 배포한다. Cloudflare 어댑터는 비활성화되어 있고, 조회수 전용 Worker API와 DB는 구축하지 않았다. Cloudflare Web Analytics(WA)의 실제 활성화 상태와 해당 계정의 API 데이터 접근 가능 여부는 확인이 필요하다.

## 논의한 요구사항

- 글별로 조회수를 구분한다. 예를 들어 `articles/performance/request-animation-frame-flow`와 `notes/2026-11-05`를 서로 다른 키로 취급한다.
- 본문은 정적 HTML로 바로 보여주고, 조회수 로딩이 글 읽기를 지연시키지 않도록 한다.
- 방문자가 페이지를 다시 열었을 때 다른 방문으로 늘어난 조회수를 확인할 수 있기를 원한다. 배포 시점의 숫자가 계속 고정되는 방식은 이 요구를 충족하지 못한다.
- 같은 사용자의 반복 접근·새로고침으로 조회수가 계속 증가하는 문제를 줄이고 싶다.
- ‘같은 사용자·같은 글을 24시간에 한 번만 집계’하는 정책은 요구사항이 아니다. 논의 중 제안됐지만 채택하지 않았다.
- 조회수 때문에 별도 서버·DB와 운영 부담을 크게 늘리는 것은 현재 부담스럽다.

로그인 없는 환경에서는 다른 기기에서 접속한 사람이 동일인인지 확실하게 구분하기 어렵다는 점을 확인했다. 중복 방지의 최종 기준과 허용할 오차는 아직 결정하지 않았다.

## 정적 배포와 서버 기능의 관계

조회수를 브라우저에서 갱신하는 것과, 조회수를 저장·집계하는 것은 별도 문제다. 브라우저가 API를 호출하는 방식도 공유 카운터를 직접 운영하려면 집계 서비스가 필요하다.

| 구성요소 | 역할 |
| --- | --- |
| 클라이언트 스크립트 | 페이지 진입 시 API를 호출하고 받은 숫자를 화면에 표시 |
| Cloudflare Worker | 요청을 처리하는 서버 코드 실행. 직접 서버 컴퓨터를 관리하지 않아도 서버 역할을 수행 |
| DB | 자체 집계를 구현할 때 글별 조회수와 필요한 중복 확인 기록 저장 |
| Astro 어댑터 | Astro API·Server Island 등 서버 코드를 배포 환경에 맞게 빌드. Worker나 DB 자체를 대체하지 않음 |

정적 페이지가 별도로 작성한 Worker API를 호출하는 구성에는 Astro 어댑터가 필요 없다. 반면 Astro 프로젝트 안의 서버 기능을 실행하려면 어댑터와 서버 배포 구성이 필요하다.

현재 사용 중인 Cloudflare 어댑터 계열은 Cloudflare Pages 배포를 지원하지 않는다. 이를 이용해 Server Island를 도입하려면 Workers로 배포 구성을 변경하는 작업도 검토해야 한다. 조회수 표시만을 위해 이 변경이 필요한지는 별도 판단 사항이다.

## 비교한 구현 방식

| 방식 | 자체 DB | 서버 실행 | 표시 갱신과 한계 |
| --- | --- | --- | --- |
| WA 대시보드만 사용 | 불필요 | 자체 서버 불필요 | 관리자 화면에서 통계 확인. 글 화면에는 표시하지 않음 |
| 빌드 시 WA API 조회 | 불필요 | 빌드 환경에서 조회 | 다음 배포까지 숫자 고정. 방문 시 갱신 요구에는 부적합 |
| 클라이언트 스크립트 + WA 조회용 Worker | 불필요 | 작은 Worker 필요 | 방문 시 집계 결과 조회. WA 반영 지연과 캐시 때문에 즉시 증가하는 카운터는 아님 |
| 클라이언트 스크립트 + 자체 카운터 API·DB | 필요 | Worker 등 필요 | 자체 집계·중복 방지 정책 구현 가능. 저장소와 운영 부담 추가 |
| Astro Server Island + 저장소 또는 외부 데이터 | 데이터 원천에 따라 다름 | 어댑터·서버 환경 필요 | 서버가 조회수 HTML을 생성. 정적 본문은 유지 가능하지만 배포 구성 변경 필요 |

WA 결과를 표시하는 안에서는 WA가 수집과 저장을 담당하고 블로그는 결과만 조회한다. API 토큰은 브라우저에 노출하지 않고 빌드 환경이나 Worker에 보관해야 한다. 표시용 Worker는 자체 조회수 DB 없이 API 중계와 짧은 캐시만 담당할 수 있다.

숫자 하나를 갱신하기 위해 React 아일랜드가 반드시 필요한 것은 아니다. 일반 Astro `<script>`로도 가능하다. 현재의 일반 페이지 이동에서는 페이지 로드마다 실행되며, 향후 ClientRouter를 도입하면 실행 시점을 맞춰야 한다.

Server Island도 브라우저의 추가 요청을 사용한다. 정적 HTML의 대체 콘텐츠를 먼저 보여주고 서버에서 생성한 HTML을 받아 교체하므로, JavaScript나 추가 요청이 없어지는 방식은 아니다.

## WA 통계와 중복 조회

WA의 기본 조회수는 자체 중복 방지 카운터와 같은 의미가 아니다.

| 지표 | 의미와 한계 |
| --- | --- |
| WA Page views | 페이지 조회 횟수. 동일인의 새로고침·재방문도 추가 집계될 수 있으며 고유 독자 수를 뜻하지 않음 |
| WA Visits | 외부 유입·직접 접근을 기준으로 한 방문. 한 방문에 여러 페이지 조회가 포함될 수 있으며 고유한 사람 수가 아님 |
| Zone Analytics Unique Visitors | 고유 IP 기준 지표. WA와 다른 분석 서비스이며 공유 IP·IP 변경·봇 등의 영향을 받음 |

현재 `yelihi.pages.dev`는 사용자가 관리하는 별도 도메인 Zone으로 설정한 상태가 아니다. Zone Analytics의 Unique Visitors를 현재 WA에 그대로 적용할 수 있다고 전제하지 않는다.

WA Page views를 사용하면 수집·저장을 직접 만들 필요는 줄어들지만, 반복 조회를 제외하려는 요구를 그대로 충족하지는 못한다. 측정 스크립트 차단이나 전송 실패로 모든 접근이 반드시 한 번씩 집계되는 것도 아니다.

## 방문자 식별과 중복 방지 선택지

| 방식 | 식별 범위 | 한계 |
| --- | --- | --- |
| sessionStorage | 같은 탭의 세션 | 새로고침에는 유지되지만 탭 종료 후 지속되는 식별 수단은 아님 |
| localStorage | 동일 기기·브라우저 프로필·사이트 origin | 새로고침·브라우저 재실행에도 유지. 사이트 데이터 삭제, 다른 프로필·기기, 시크릿 환경에서는 동일인 연결 불가 |
| 익명 쿠키 | 해당 브라우저의 쿠키 저장 환경 | 다른 기기와 공유되지 않으며 쿠키 삭제 시 식별 연결이 끊김 |
| IP | 접속 네트워크 주소 | 공유 Wi-Fi의 여러 사람을 하나로 묶거나 네트워크 전환·VPN 사용자를 여러 명으로 나눌 수 있음 |
| 로그인 계정 | 계정으로 식별한 사용자 | 기기를 넘어 연결할 수 있지만 인증 기능이 필요. 실제 사람 수와 완전히 일치하는 것은 아님 |

`localStorage`에 집계 완료한 글 ID를 기록하는 안은 같은 브라우저의 불필요한 증가 요청을 줄일 수 있다. 다만 공유 조회수의 저장소를 대체하거나, WA의 기본 Page views를 중복 제거된 값으로 바꾸는 기능은 아니다.

서버 측 중복 처리를 직접 구현한다면 동시 요청에도 한 번만 증가하도록 저장소에서 원자적으로 처리해야 한다. 이 사항은 구현 시 검토할 내용이며 현재 구축 대상이 아니다.

## 비용과 운영 부담

어댑터 자체를 사용한다는 이유로 실행 요금이 붙는 구조는 아니다. Worker 요청·CPU 사용량, DB 읽기·쓰기·저장량과 선택한 요금제 등이 비용을 결정한다.

논의 시 확인한 Workers Free 범위는 하루 10만 요청과 요청당 CPU 10ms, Paid는 계정 기준 월 최소 5달러였다. D1에도 무료 사용량이 있지만 실제 쿼리와 다른 프로젝트의 계정 사용량에 따라 여유가 달라진다. 가격은 2026-11-15 확인 기준이며 구현 재개 시 다시 확인한다.

현재 판단에서는 작은 조회수 기능의 금액보다 배포 이전, 런타임 호환성, API 오류 처리, 저장소 관리와 중복 집계 정책의 유지보수 부담이 더 중요한 비교 요소다. 실제 방문량이나 부하에 근거한 월 비용 산정은 하지 않았다.

## 현재 결정과 재개 시 확인할 사항

현재는 조회수 기능을 구현하지 않고 Cloudflare Pages의 정적 배포를 유지한다. 사용자에게 본문을 빠르게 제공하는 것을 우선하며, 조회수를 위한 Worker·DB·Astro 어댑터·클라이언트 스크립트는 추가하지 않는다. 이번 반영 범위는 이 논의 문서뿐이다.

WA 활용은 가장 간단한 통계 수집 후보로 논의했지만, 활성화·API 연동·조회수 표시 방식·중복 방지 기준은 확정하지 않았다. 아래 항목은 도입을 다시 검토할 때 확인한다.

재개할 때 다음 항목을 먼저 정한다.

1. 관리자용 방문 통계만 필요한지, 글 화면의 조회수 표시까지 필요한지.
2. 반복 조회를 포함하는 WA Page views를 허용할지, 브라우저별 또는 계정별 중복 제거가 필요한지.
3. 표시 지표와 기간. 최근 일정 기간 조회수와 글 발행 이후 누적 조회수를 구분한다.
4. WA 활성화·실제 수집 여부, 해당 계정에서 조회 가능한 API 필드·보관 기간·한도.
5. WA 활용 시 갱신 지연·캐시 기간·API 실패 시 표시 방식.
6. 자체 카운터를 선택한다면 글 ID의 안정성. 경로 이동 시 기존 조회수를 이어갈 방법도 정한다.

## 공식 참고 자료

- [Cloudflare Pages에서 Web Analytics 활성화](https://developers.cloudflare.com/pages/how-to/web-analytics/)
- [WA Page views와 Visits 정의](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)
- [WA 경로 등 분류 기준](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)
- [WA FAQ와 측정 누락 관련 설명](https://developers.cloudflare.com/web-analytics/faq/)
- [Cloudflare GraphQL 분석 API 데이터셋](https://developers.cloudflare.com/data-localization/metadata-boundary/graphql-datasets/)
- [GraphQL 분석 API 인증](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/)
- [Zone Analytics](https://developers.cloudflare.com/analytics/account-and-zone-analytics/zone-analytics/)
- [Cloudflare 분석의 IP 기반 방문자 지표](https://developers.cloudflare.com/analytics/faq/about-analytics/)
- [Astro Server Islands](https://docs.astro.build/en/guides/server-islands/)
- [Astro Cloudflare 어댑터와 Pages 지원 제거](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#removed-cloudflare-pages-support)
- [Workers 요금](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 요금](https://developers.cloudflare.com/d1/platform/pricing/)
