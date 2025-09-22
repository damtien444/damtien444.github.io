---
layout: homepage
title: "Finetuning Gr00t-N1.5 on Libero Synthesis Dataset"
date: 2025-09-18
---

<style>
.highlight-1st { background-color: #f142429d; padding: 2px 4px; border-radius: 3px; }
.highlight-2nd { background-color: #f9fe5a7d; padding: 2px 4px; border-radius: 3px; }
.highlight-3rd { background-color: #2775c276; padding: 2px 4px; border-radius: 3px; }
.highlight-gold { background-color: #FFD700; padding: 2px 4px; border-radius: 3px; }
.highlight-silver { background-color: #C0C0C0; padding: 2px 4px; border-radius: 3px; }
.highlight-bronze { background-color: #CD7F32; color: white; padding: 2px 4px; border-radius: 3px; }
.highlight-red { background-color: #FF6B6B; color: white; padding: 2px 4px; border-radius: 3px; }
.highlight-blue { background-color: #4ECDC4; color: white; padding: 2px 4px; border-radius: 3px; }
.highlight-purple { background-color: #A8E6CF; padding: 2px 4px; border-radius: 3px; }
</style>

# Finetuning Gr00t-N1.5 on Libero Synthesis Dataset


*TL;DR:* 
1. Don't finetune for too long
2. Bigger batch size is better
3. Should use 4 denoise steps
4. Did not outperform Pi-zero
5. Need to tune midway planning for better performance


Recently, I became excited about a generalist vision-language-action model called [Gr00t-N1](https://github.com/NVIDIA/Isaac-GR00T) by Nvidia. They introduced me to the idea of VLA models, which provide intuition of language and vision from a VLM model to an action generation model. However, I learned that Gr00t is not the first of its kind—I found [this very helpful blog](https://skalade.github.io/posts/robot_actions_overview/) that explains the development of VLA research thoroughly. 

In this post, I will report my experience trying to finetune Gr00t-N1.5 on the Libero Synthesis Dataset. 

## Short introduction

1. Gr00t is a generalist robot action generation model, which has a VLM and a diffusion generation head. The VLM was trained on an internet-scale dataset and can understand the relationship between visual information and language instructions. In inference, the VLM produces meaningful embeddings that contain context information, then the diffusion head takes those embeddings and previous observations of its state to generate the next chunk of actions. 

2. [Libero](https://libero-project.github.io/datasets) is a synthesis dataset built to tackle the problem of lifelong learning in robotics with the idea of learning a generalist agent that learns and adapts over time. It contains different task sets to test policies in terms of spatial, object, goal understanding and long-horizon tasks. Libero provides an easy-to-run environment and model evaluation.

## Before training

The [OpenVLA paper](https://arxiv.org/abs/2406.09246) includes clear guidance and process to use Libero to test the model. It also released the test results for 3 models: Diffusion Policy, Octo, OpenVLA. So for a fair comparison and effort saving, I will use the same dataset as in OpenVLA to finetune Gr00t.

Initially, I found a very helpful [script from the repository of OpenPI](https://github.com/Physical-Intelligence/openpi/tree/36dc3c037eb8a3921be9ecb94369d60cbf56f58f/examples/libero) to process the original dataset into the state of OpenVLA. Then, I cloned the original dataset and let it process. However, it said that it would take me the whole day to just change the format of the dataset. Apart from this, I also collected the results of Pi-0 and Pi-fast from here as baselines.

Fortunately, I found [another preprocessed dataset](https://huggingface.co/collections/IPEC-COMMUNITY/libero-benchmark-dataset-684837af28d465aa8b043950) on HuggingFace that is ready to use. More conveniently, it is already in the format of LeRobot dataset, which is the format Gr00t requires. So I decided to solely use this dataset to train Gr00t. 

Gr00t requires a definition of the new dataset to be defined in a file called `modality.json` in the meta folder of the dataset. I found [a helpful issue](https://github.com/NVIDIA/Isaac-GR00T/issues/136) where people share their config file and experience in training Gr00t on Libero, so I just reused them.

## Let's train

I use a 3080 that has 10 GB of VRAM and it could only fit to train with LoRA 32 and batch size 1. Originally, I had a pair of them, but the second one got so hot that it killed the whole training process. 

From the original readme of Gr00t, they stated to "boost the batch size to the max, and train for 20k steps." To resemble the effect of big batch size, I can use multiple devices, using grad accumulation. I ran a few training jobs just to realize it would take the whole day for a single run.

However, I still wanted to test the model capabilities when finetuned with the least hardware that I have. So I set LoRA 32 and batch size 1 and let it run for 30k steps. To my surprise, the finetuning process ran very fast, it only took roughly 1 hour to finetune on each subset of Libero on my machine. But there is no low hanging fruit here, the evaluation result for this run was disappointing.

Therefore, I run more with longer training for 50k steps, and try to boost the batch size and lora rank. The final results are reported in the following table.

|                                                          | LIBERO-Spatial | LIBERO-Object | LIBERO-Goal | LIBERO-Long (10) |
| -------------------------------------------------------- | -------------- | ------------- | ----------- | ---------------- |
| Diffusion Policy                                         | 78.3           | 92.5           | 68.3        | 50.5             |
| Octo finetuned                                           | 78.9           | 85.7           | 84.6        | 51.1             |
| OpenVLA                                                  | 84.7           | 88.4          | 79.2      | 53.7             |
| π0-FAST @ 30k (finetuned)                                | <span class="highlight-2nd">96.4</span>           | <span class="highlight-2nd">96.8</span>           | <span class="highlight-2nd">88.6</span>        | 60.2            |
| π0 @ 30k (finetuned)                                     | <span class="highlight-1st">96.8</span>           | <span class="highlight-1st">98.8</span>           | <span class="highlight-1st">95.8</span>        | <span class="highlight-1st">85.2</span>             |
| Groot N1.5 @ 30k, lora 32, b1 (finetuned), 3080          | <span class="highlight-3rd">89.0</span>/68.2      | 83.8/86.0        | <span class="highlight-3rd">87.8</span>/78.2   | 46.2/31.6        |
| Groot N1.5 @ 50k, lora 32, b1 (finetuned), 3080          | 69.8/40.0      | 62.2/55.6      | 64.0/59.4   | 25.9/17.6        |
| Groot N1.5 @ 30k, lora 64, b16 (finetuned), 4060ti, 3090 | -              | <span class="highlight-3rd">96.4</span>/96.0     | -           | <span class="highlight-3rd">67.4</span>/64.0        |
| Groot N1.5 @ 30k, full, b32 (finetuned), A6000           | -              | -              | -           | 53.0/<span class="highlight-2nd">77.0</span>        |

*Results show two separate training runs with the first value being replanning of 5 and the latter value being no replanning. Color coding: <span class="highlight-1st">Red = 1st place</span>, <span class="highlight-2nd">Yellow = 2nd place</span>, <span class="highlight-3rd">Blue = 3rd place</span> (ranked by column).

Gr00t-N1 does not outperform the baseline of π0 in any metrics. I thought it was due to the replanning configuration, so I also tried with no replanning, however changing replanning seems to have unclear effects on the final performance.

Longer training with 50k steps may hurt the performance, this is also reported by [someone on the huggingface](https://huggingface.co/blog/nvidia/gr00t-n1-5-so101-tuning#:~:text=NVIDIA%E2%80%99s%20livestreams%20that%20there%E2%80%99s%20a%20chance%20of%20overtraining). It seems that training too long will make the model forget what it has learnt and "ignore the text prompt".

Bigger batchsize is generally better, which is consistent with the author's advice. However, it comes with the cost of hardware and longer training time. I could only afford to run limited times on those bigger hardware. 

## Further experiments

In this part, I use the hardest task set in the libero dataset to get a bigger effect in asserting the model performance. And I could only do full rank training once for this task.

### Does more denoising steps help with the model performance?

I ran evaluation with denoising step of 4, 8 and 16, and reported results in the following figure.

![Denoising steps performance comparison]({{ '/assets/img/2025-09-21-denoising.png' | relative_url }})

It is quite clear from the results that increase the number of denoising steps hurt the model performance. This is counter intuitive for me that, theoritical speaking, the more steps the better quality the generation should be. However in this task the model seems to fail for longer and better generation. 

My current explanation for this is that when it have longer denoise steps it will generate too precise position of the robot and also it may be too overfit into the training dataset. So that it lose the generality and fail the tasks.

### Does replan midway affect the model performance?

Replanning midway means that after a number of execution steps the model will see new observation and produce new motion sequence. The smaller replanning steps mean the more frequent the model got to see feedback from the environment and produce more grounded motion. However, it would produce jitteriness and imprecise trajectory when transferring between two windows of sequence.

I tested three different checkpoints (fullrank, lora64 and lora32) on Libero-10. As illustrated in the chart, the lora64 and fullrank model performances are comparable and better than the performance of lora 32 with batch size 1.

![Replan Midway vs No replan]({{  '/assets/img/2025-09-21-replan-midway.png' | relative_url }}) 

However, the performance of the fullrank checkpoint with 5 replan steps is far too low compared to other checkpoints. And the lora 32 checkpoint with 5 replan steps has a big margin compared to 12 steps and no replanning. While the lora64 checkpoint's performance for three options are stable. 

For the better performance, one should conduct a parameter search to make the best performance out of the model.

## Code

I log the necessary code in two repositories:

1. [https://github.com/damtien444/Isaac-GR00T](https://github.com/damtien444/Isaac-GR00T)

In the Gr00t repository, I add the data config that to process the Libero dataset. And also store the modality.json for Libero dataset in the root directory of the repo. To finetune, you can just clone this repo, clone the dataset from HuggingFace, and copy the modality.json to the meta folder of the dataset. Then finetuning with the following call:

`python scripts/gr00t_finetune.py --dataset_path path/to/community_libero_object --data_config libero`

2. [https://github.com/damtien444/openpi](https://github.com/damtien444/openpi)

I make use of the libero evaluation code in this repository, and change the policy call to make it compatible with the `inference_service.py` of Gr00t.

I prepare a [batch script](https://github.com/damtien444/openpi/blob/main/evaluation.sh) to call both the gr00t inference service and evaluation environment.

While I was conducting this experiment, the repository of Gr00t has updated and [provided official support](https://github.com/NVIDIA/Isaac-GR00T/tree/main/examples/Libero) to test on Libero synthesis dataset. The results provided there is consistent with what I got from this post, so for an easier path, you can just follow the steps there to reproduce the results here.

## Conclusion

Gr00t-N1 is a promising genralists model for cross-embodiment motion generation. The model outperformed many previous methods such as Diffusion Policy, Octo, and OpenVLA while loss to Pi0 and Pi0-fast. 
