'use client';

import Loading from '@/app/(interactive)/petitions/[id]/loading';

export const runtime = 'edge';

import {ImageCarousel} from '@/app/(interactive)/petitions/[id]/_components/ImageCarousel';
import {useAuthState} from '@/auth/token-manager';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {trpc} from '@/trpc/client';
import {Share2, ThumbsDown, ThumbsUp, MessageSquare} from 'lucide-react';
import {useParams, useRouter, useSearchParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {useSocialShareStore} from '@/store/useSocialShareStore';
import {PetitionShareModal} from './_components/PetitionShareModal';
import {SocialShareSheet} from './_components/SocialShareSheet';

import CommentThread from './_components/comments/Thread';
import SuggestedPetitions from './_components/SuggestedPetitions';

import {useToast} from '@/components/ui/use-toast';
import {JobabForm} from '@/components/admin/JobabForm';
import JobabTimeline from './_components/JobabTimeline';

export default function Petition() {
    const utils = trpc.useUtils();

    const router = useRouter();
    const searchParams = useSearchParams();
    const isAuthenticated = useAuthState();

    const {data: selfResponse} = trpc.users.getSelf.useQuery(undefined, {
        enabled: !!isAuthenticated,
    });

    const {id: petition_id} = useParams<{id: string}>();

    const {
        data: petition,
        refetch,
        isLoading,
    } = trpc.petitions.get.useQuery(
        {
            id: petition_id!!,
        },
        {
            enabled: isAuthenticated !== null,
        },
    );

    const {data: commentCount} = trpc.comments.totalCount.useQuery({
        petition_id: petition_id,
    });

    const {openShareModal} = useSocialShareStore();

    const isSubmitted = Boolean(searchParams.get('status') === 'submitted');

    const [userVote, setUserVote] = useState<number | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showSuggestedPetitionsModal, setShowSuggestedPetitionsModal] =
        useState(false);
    const [showJobabForm, setShowJobabForm] = useState(false);

    useEffect(() => {
        if (isSubmitted) {
            setShowSuccessModal(true);
        }
    }, [isSubmitted]);

    useEffect(() => {
        if (petition?.extras.user_vote !== undefined) {
            setUserVote(petition.extras.user_vote);
        }
    }, [petition?.extras.user_vote]);

    const thumbsUpMutation = trpc.petitions.vote.useMutation({
        onSuccess: () => setShowSuggestedPetitionsModal(true),
    });
    const thumbsDownMutation = trpc.petitions.vote.useMutation({
        onSuccess: () => setShowSuggestedPetitionsModal(true),
    });
    const clearVoteMutation = trpc.petitions.clearVote.useMutation();

    const {toast} = useToast();

    const clickThumbsUp = async () => {
        if (!isAuthenticated) {
            redirectToLoginPage();
            return;
        }

        if (userVote === 1) {
            await clearVoteMutation.mutateAsync({
                petition_id: petition_id!!,
            });
            setUserVote(0);
        } else {
            await thumbsUpMutation.mutateAsync({
                petition_id: petition_id!!,
                vote: 'up',
            });
            setUserVote(1);
            toast({
                title: '👍🏽 Upvoted দাবি',
                description: 'You have successfully upvoted the দাবি',
            });
        }
        refetch();
    };

    const clickThumbsDown = async () => {
        if (!isAuthenticated) {
            redirectToLoginPage();
            return;
        }

        if (userVote === -1) {
            await clearVoteMutation.mutateAsync({
                petition_id: petition_id!!,
            });
            setUserVote(0);
        } else {
            await thumbsDownMutation.mutateAsync({
                petition_id: petition_id!!,
                vote: 'down',
            });
            setUserVote(-1);
            toast({
                title: '👎🏽 Downvoted দাবি',
                description: 'You have successfully downvoted the দাবি',
            });
        }
        refetch();
    };

    const redirectToLoginPage = () => {
        const nextUrl = encodeURIComponent(`/petitions/${petition_id}`);
        router.push(`/login?next=${nextUrl}`);
    };

    const upvoteCount = petition?.data.petition_upvote_count ?? 0;
    const downvoteCount = petition?.data.petition_downvote_count ?? 0;
    const upvoteTarget = petition?.data.upvote_target ?? 0;
    const totalVoteCount = upvoteCount + downvoteCount;

    const achievement = upvoteCount / Number(upvoteTarget);
    const achievementPercentage = Math.round(achievement * 100);

    const isOwnPetition =
        petition &&
        selfResponse &&
        `${petition?.data.created_by}` === `${selfResponse?.data.id}`;

    const isAdmin = !!selfResponse?.meta.token.is_user_admin;
    const isMod = !!selfResponse?.meta.token.is_user_moderator;
    const status = petition?.data.status ?? 'draft';

    const isFlagged = petition?.data.flagged_at !== null;

    const {mutate: approve} = trpc.petitions.approve.useMutation({
        onSuccess: async () => {
            await utils.petitions.get.invalidate({id: petition_id});
        },
    });

    const {mutate: reject} = trpc.petitions.reject.useMutation({
        onSuccess: async () => {
            await utils.petitions.get.invalidate({id: petition_id});
        },
    });

    const {mutate: formalize} = trpc.petitions.formalize.useMutation({
        onSuccess: async () => {
            await utils.petitions.get.invalidate({id: petition_id});
        },
    });

    const {mutate: flag} = trpc.petitions.flag.useMutation({
        onSuccess: async () => {
            await utils.petitions.get.invalidate({id: petition_id});
        },
    });

    return isLoading ? (
        <Loading />
    ) : (
        <>
            <div className="max-w-screen-sm mx-auto px-4 pt-12 mb-28 flex flex-col gap-4">
                {status === 'flagged' &&
                !isOwnPetition &&
                !isMod &&
                !isAdmin ? (
                    <div className={'bg-border px-3 py-2 rounded-lg'}>
                        <div className={'font-bold text-red-500 text-sm'}>
                            This petition was flagged.
                        </div>
                        <div>{petition?.data.flagged_reason ?? ''}</div>
                    </div>
                ) : null}

                {isOwnPetition || isMod || isAdmin ? (
                    <div
                        className={
                            'bg-border px-3 py-2 rounded-lg flex justify-end items-center gap-2'
                        }>
                        {status === 'rejected' ? (
                            <div className={'flex-1'}>
                                <div
                                    className={
                                        'font-bold text-red-500 text-sm'
                                    }>
                                    Your petition was rejected.
                                </div>
                                <div>
                                    {petition?.data.rejection_reason ?? ''}
                                </div>
                            </div>
                        ) : null}
                        {status === 'flagged' ? (
                            <div className={'flex-1'}>
                                <div
                                    className={
                                        'font-bold text-red-500 text-sm'
                                    }>
                                    Your petition was flagged.
                                </div>
                                <div>{petition?.data.flagged_reason ?? ''}</div>
                            </div>
                        ) : null}
                        {isMod || isAdmin ? (
                            <div className={'flex flex-row gap-2 items-center'}>
                                {status === 'submitted' ? (
                                    <span className={'text-sm'}>
                                        NOT MODERATED YET
                                    </span>
                                ) : null}
                                {status === 'approved' ? (
                                    <>
                                        <Button
                                            size={'sm'}
                                            intent={'success'}
                                            onClick={() =>
                                                setShowJobabForm(true)
                                            }>
                                            Add জবাব
                                        </Button>
                                        <Button
                                            size={'sm'}
                                            intent={'success'}
                                            onClick={() => {
                                                const confirmed =
                                                    window.confirm(
                                                        '⚠️⚠️⚠️ You sure you wanna elevate to this some next level shizz? ⚠️⚠️⚠️',
                                                    );

                                                if (!confirmed) {
                                                    return;
                                                }

                                                const target = window.prompt(
                                                    '🎯🎯🎯 Set the target number of up-votes required to elevate to authorities. 🎯🎯🎯',
                                                    '1000',
                                                );

                                                if (!target) {
                                                    return;
                                                }

                                                const parsed = Number(target);

                                                if (
                                                    !(
                                                        parsed > 0 &&
                                                        parsed < Infinity
                                                    )
                                                ) {
                                                    window.alert(
                                                        'Invalid target number.',
                                                    );
                                                    return;
                                                }

                                                formalize({
                                                    petition_id:
                                                        Number(petition_id),
                                                    upvote_target: parsed,
                                                });
                                            }}>
                                            Formalize
                                        </Button>
                                    </>
                                ) : null}
                                {status === 'submitted' ||
                                status === 'rejected' ? (
                                    <Button
                                        size={'sm'}
                                        intent={'success'}
                                        onClick={() =>
                                            window.confirm(
                                                'You sure you wanna approve?',
                                            ) &&
                                            approve({
                                                petition_id:
                                                    Number(petition_id),
                                            })
                                        }>
                                        Approve
                                    </Button>
                                ) : null}
                                {status === 'flagged' && (
                                    <Button
                                        size={'sm'}
                                        intent={'success'}
                                        onClick={() =>
                                            window.confirm(
                                                'You sure you wanna unflag?',
                                            ) &&
                                            flag({
                                                petition_id:
                                                    Number(petition_id),
                                                flagged: true,
                                            })
                                        }>
                                        Unflag
                                    </Button>
                                )}
                                {status !== 'rejected' &&
                                status !== 'draft' &&
                                status !== 'flagged' &&
                                status !== 'submitted' ? (
                                    <Button
                                        size={'sm'}
                                        intent={'default'}
                                        onClick={() => {
                                            const flagReason = window.prompt(
                                                'Why you flagging this petition? (leave empty to cancel)',
                                            );

                                            flagReason &&
                                                flag({
                                                    petition_id:
                                                        Number(petition_id),
                                                    reason: flagReason,
                                                    flagged: false,
                                                });
                                        }}>
                                        Flag
                                    </Button>
                                ) : null}

                                {status === 'submitted' ? (
                                    <Button
                                        size={'sm'}
                                        intent={'default'}
                                        onClick={() => {
                                            const rejectionReason =
                                                window.prompt(
                                                    'Why you rejecting? (leave empty to cancel)',
                                                );

                                            rejectionReason &&
                                                reject({
                                                    petition_id:
                                                        Number(petition_id),
                                                    reason: rejectionReason,
                                                });
                                        }}>
                                        Reject
                                    </Button>
                                ) : null}
                            </div>
                        ) : null}

                        {isOwnPetition || isAdmin ? (
                            <Button
                                size={'sm'}
                                onClick={() =>
                                    router.push(
                                        `/petitions/${petition_id}/edit`,
                                    )
                                }>
                                Edit দাবি
                            </Button>
                        ) : null}
                    </div>
                ) : null}

                <div className={'space-x-1 text-lg text-stone-500'}>
                    <time
                        dateTime={
                            petition?.data.created_at
                                ? new Date(
                                      petition.data.created_at,
                                  ).toISOString()
                                : ''
                        }
                        suppressHydrationWarning>
                        {petition?.data.created_at
                            ? new Date(
                                  petition.data.created_at,
                              ).toLocaleDateString('en-GB', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                              })
                            : 'UNKNOWN DATE'}
                        {','}
                    </time>
                    <span className={'italic font-semibold'}>
                        {petition?.extras.user.name ?? ''}
                    </span>
                    <span>—</span>
                    <span>To</span>
                    <span className={'italic font-semibold'}>
                        {petition?.data.target ?? 'UNKNOWN MINISTRY'}.
                    </span>
                </div>
                <div className="flex items-start flex-col">
                    <h1 className="text-4xl font-bold font-serif flex-1">
                        {petition?.data.title ?? 'Untiled Petition'}
                    </h1>

                    {petition?.data.status === 'formalized' ? (
                        <div className={'w-full my-4'}>
                            <div
                                className={
                                    'font-semibold text-black px-1 flex items-center flex-row space-x-4'
                                }>
                                <div
                                    className={
                                        'px-2 py-1 bg-red-500 flex-1 flex flex-row items-center rounded-full'
                                    }>
                                    <div
                                        className={
                                            'h-2 flex-1 bg-background mr-2 rounded-full overflow-clip'
                                        }>
                                        <div
                                            className={
                                                'h-2 bg-black rounded-full'
                                            }
                                            style={{
                                                width: `${achievementPercentage}%`,
                                            }}></div>
                                    </div>
                                    <span className={''}>
                                        {achievementPercentage}%
                                    </span>
                                </div>
                                <div>
                                    <span className={'text-black'}>আরো</span>{' '}
                                    <span className={'text-red-500'}>
                                        {upvoteTarget - upvoteCount}
                                    </span>
                                    <span className={'text-black'}>
                                        -টা Vote দরকার
                                    </span>{' '}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {petition?.data.status !== 'rejected' &&
                        petition?.data.status !== 'draft' && (
                            <div
                                className="flex items-center gap-1.5 text-primary/80 rounded-2xl border px-4 py-2 mt-4 hover:border-red-500 hover:text-red-500 transition-colors"
                                role="button"
                                onClick={() => openShareModal()}>
                                <Share2 className="size-3" />
                                <p className="text-xs">Share</p>
                            </div>
                        )}
                </div>

                <div className="space-x-2 border-l-4 pl-4 text-neutral-700 text-lg">
                    <span>It affects</span>
                    <span className={'italic font-semibold'}>
                        {petition?.data.location ?? 'SOMEONE, SOMEWHERE'}.
                    </span>
                </div>
                <ImageCarousel />
                {petition?.data.description && (
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-a:text-blue-600 prose-a:underline hover:prose-a:no-underline">
                        {petition.data.description ?? 'No description yet.'}
                    </Markdown>
                )}
                {!!petition?.data.attachments.filter(
                    (attachment) => attachment.type === 'file',
                ).length && (
                    <div>
                        <h2 className="text-lg font-bold">Files</h2>
                        {petition.data.attachments
                            .filter((attachment) => attachment.type === 'file')
                            .map((attachment, a) => (
                                <a
                                    className="text-sm text-blue-400 underline block"
                                    key={a}
                                    href={attachment.attachment.replace(
                                        '$CORE_HOSTNAME',
                                        window.location.hostname,
                                    )}
                                    target="_blank">
                                    {attachment.filename}
                                </a>
                            ))}
                    </div>
                )}
                <JobabTimeline petitionId={Number(petition_id)} />
                <CommentThread />
            </div>
            <div className="fixed bottom-0 left-0 w-full py-2 bg-background z-20 px-2 sm:px-4 border-t">
                <div
                    className={
                        'w-full mx-auto max-w-screen-sm flex flex-row items-center gap-1 sm:gap-2'
                    }>
                    <Button
                        variant={
                            userVote === 1 || userVote === 0
                                ? 'default'
                                : 'outline'
                        }
                        intent={'success'}
                        size={'lg'}
                        className="flex-1"
                        disabled={isFlagged}
                        onClick={clickThumbsUp}>
                        {status === 'formalized' ? (
                            <>
                                <p className="ml-1 text-sm sm:text-base">
                                    {upvoteCount} — VOTE
                                </p>
                            </>
                        ) : (
                            <>
                                <ThumbsUp
                                    size={18}
                                    fill={
                                        userVote === 1
                                            ? '#000'
                                            : userVote === 0
                                              ? '#fff'
                                              : '#28c45c'
                                    }
                                />
                                <p className="ml-1 text-sm sm:text-base">
                                    {upvoteCount}
                                </p>
                            </>
                        )}
                    </Button>
                    <Button
                        variant={
                            userVote === -1 || userVote === 0
                                ? 'default'
                                : 'outline'
                        }
                        intent={'default'}
                        className="flex-1"
                        disabled={isFlagged}
                        size={'lg'}
                        onClick={clickThumbsDown}>
                        <ThumbsDown
                            size={18}
                            fill={
                                userVote === -1
                                    ? '#000'
                                    : userVote === 0
                                      ? '#e03c3c'
                                      : '#fff'
                            }
                        />
                        <p className="ml-1 text-sm sm:text-base">
                            {downvoteCount}
                        </p>
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-1 sm:gap-2 text-stone-800 px-2 sm:px-3"
                        onClick={() => {
                            const commentSection =
                                document.getElementById('comments');
                            if (commentSection) {
                                commentSection.scrollIntoView({
                                    behavior: 'smooth',
                                });
                            }
                        }}>
                        <MessageSquare size={18} />
                        <span className="text-sm sm:text-base">
                            {commentCount?.data?.count ?? 0}
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-1 sm:gap-2 text-stone-800 px-2 sm:px-3"
                        onClick={() => openShareModal()}>
                        <Share2 size={18} />
                        <span className="text-sm sm:text-base">Share</span>
                    </Button>
                </div>

                {showSuccessModal && (
                    <PetitionShareModal
                        isOpen={showSuccessModal}
                        setIsOpen={setShowSuccessModal}
                    />
                )}

                {showSuggestedPetitionsModal && (
                    <SuggestedPetitions
                        petitionId={petition?.data.id ?? ''}
                        location={petition?.data.location ?? ''}
                        target={petition?.data.target ?? ''}
                        isOpen={showSuggestedPetitionsModal}
                        setIsOpen={setShowSuggestedPetitionsModal}
                    />
                )}

                <SocialShareSheet />
            </div>
            <JobabForm
                isOpen={showJobabForm}
                onClose={() => setShowJobabForm(false)}
                petitionId={Number(petition_id)}
            />
        </>
    );
}
